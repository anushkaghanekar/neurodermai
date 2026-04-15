from __future__ import annotations

import io
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile, status, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from app.config import get_settings
from app.database import init_db, close_db, get_db
from app.inference import HuggingFaceError, predict_with_huggingface, validate_image_bytes
from app.knowledge import DISCLAIMER, CLASS_GUIDANCE
from app.auth import register_user, login_user, get_current_user, require_auth
from app.history import save_scan, get_user_scans, get_scan_detail, get_user_scan_count, update_scan_notes
from app.reports import ReportGenerator
from app.chatbot import get_chat_response


settings = get_settings()


# ---------- Lifespan: DB init / teardown ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="NeuroDermAI API",
    version="3.0.1",
    description=(
        "Inference API for classifying skin conditions from images using a "
        "DINOv2 model hosted on HuggingFace. Features user accounts, history, "
        "and professional PDF report generation."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Pydantic models for requests ----------
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class NotesRequest(BaseModel):
    user_notes: str


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    scan_context: dict | None = None


# ---------- Health / Metadata ----------
@app.get("/health")
async def health_check() -> dict[str, Any]:
    has_token = settings.hf_token is not None
    
    # Check DB connection
    db_status = "error"
    try:
        pool = await get_db()
        async with pool.acquire() as conn:
            await conn.execute("SELECT 1")
            db_status = "connected (PostgreSQL)"
    except Exception as e:
        db_status = f"connection_failed: {str(e)}"

    return {
        "status": "ok",
        "database": db_status,
        "image_storage": "Cloudinary" if settings.cloudinary_url else "local",
        "model_id": settings.hf_model_id,
        "hf_token_configured": has_token,
    }


@app.get("/metadata")
def metadata() -> dict:
    return {
        "ready": True,
        "model_id": settings.hf_model_id,
        "class_names": sorted(CLASS_GUIDANCE.keys()),
        "num_classes": len(CLASS_GUIDANCE),
        "backbone": "DINOv2 (facebook/dinov2-base)",
        "disclaimer": DISCLAIMER,
        "hf_token_configured": settings.hf_token is not None,
        "error": None,
    }


# ---------- Auth Endpoints ----------
@app.post("/auth/register")
async def register(body: RegisterRequest) -> dict:
    return await register_user(body.email, body.password, body.name)


@app.post("/auth/login")
async def login(body: LoginRequest) -> dict:
    return await login_user(body.email, body.password)


@app.get("/auth/me")
async def get_me(user: dict[str, Any] = Depends(require_auth)) -> dict:
    return {"user": user}


# ---------- Predict ----------
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    user: dict[str, Any] | None = Depends(get_current_user),
) -> dict:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename was provided.",
        )

    # Content-type validation
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Expected an image file but received '{file.content_type}'. "
                "Please upload a JPEG, PNG, or WebP image."
            ),
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Uploaded file exceeds the {settings.max_upload_bytes // (1024 * 1024)} MB "
                "limit."
            ),
        )

    try:
        result = await predict_with_huggingface(content, settings)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except HuggingFaceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    # Auto-save to history if user is authenticated
    saved_to_history = False
    if user is not None:
        try:
            scan_id = await save_scan(user["id"], content, result)
            result["scan_id"] = scan_id
            saved_to_history = True
        except Exception:
            pass  # Don't fail the prediction if history save fails

    result["saved_to_history"] = saved_to_history
    return result


# ---------- Scan History & Reports ----------
@app.get("/history")
async def history(
    user: dict[str, Any] = Depends(require_auth),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    scans = await get_user_scans(user["id"], limit=limit, offset=offset)
    total = await get_user_scan_count(user["id"])
    return {
        "scans": scans,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/history/{scan_id}")
async def history_detail(
    scan_id: int,
    user: dict[str, Any] = Depends(require_auth),
) -> dict:
    scan = await get_scan_detail(user["id"], scan_id)
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found.",
        )
    return scan


@app.patch("/history/{scan_id}/notes")
async def update_notes(
    scan_id: int,
    body: NotesRequest,
    user: dict[str, Any] = Depends(require_auth),
) -> dict:
    success = await update_scan_notes(user["id"], scan_id, body.user_notes)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found or unauthorized.",
        )
    return {"status": "ok", "message": "Notes updated."}


@app.get("/history/{scan_id}/report")
async def get_report(
    scan_id: int,
    user: dict[str, Any] = Depends(require_auth),
):
    scan = await get_scan_detail(user["id"], scan_id)
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found.",
        )
    
    generator = ReportGenerator(scan, user)
    try:
        pdf_bytes = generator.generate()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}",
        )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=NeuroDermAI-Report-{scan_id}.pdf"
        }
    )


# ---------- AI DermAssistant ----------
@app.post("/chat")
async def chat(
    body: ChatRequest,
    user: dict[str, Any] | None = Depends(get_current_user),
) -> dict:
    """Send a message to the AI DermAssistant and get a contextual response."""
    response_text = await get_chat_response(
        user_message=body.message,
        conversation_history=body.history,
        scan_result=body.scan_context,
    )
    return {"response": response_text}
