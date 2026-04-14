from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.inference import HuggingFaceError, predict_with_huggingface, validate_image_bytes
from app.knowledge import DISCLAIMER, CLASS_GUIDANCE


# Allowed image file extensions (lowercase, with leading dot).
_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".tif"}

settings = get_settings()

app = FastAPI(
    title="NeuroDermAI API",
    version="2.0.0",
    description=(
        "Inference API for classifying skin conditions from images using a "
        "DINOv2 model hosted on HuggingFace."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str | bool | None]:
    has_token = settings.hf_token is not None
    return {
        "status": "ok",
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


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
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

    # Extension validation
    ext = Path(file.filename).suffix.lower()
    if ext and ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"File extension '{ext}' is not supported. "
                "Please upload a JPEG, PNG, WebP, GIF, BMP, or TIFF image."
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
        return await predict_with_huggingface(content, settings)
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
