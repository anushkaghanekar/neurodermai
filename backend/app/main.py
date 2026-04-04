from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from app.inference import (
    ArtifactError,
    get_model_metadata,
    get_predictor,
    get_runtime_settings,
    warmup_model,
)
from app.knowledge import DISCLAIMER


settings = get_runtime_settings()
runtime_state = {
    "ready": False,
    "startup_error": None,
}


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        warmup_model()
        runtime_state["ready"] = True
        runtime_state["startup_error"] = None
    except ArtifactError as exc:
        runtime_state["ready"] = False
        runtime_state["startup_error"] = str(exc)
    yield


app = FastAPI(
    title="NeuroDermAI API",
    version="1.0.0",
    description=(
        "Inference API for classifying common skin conditions from images using a "
        "Keras model trained in Kaggle."
    ),
    lifespan=lifespan,
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
    return {
        "status": "ok" if runtime_state["ready"] else "degraded",
        "ready": runtime_state["ready"],
        "error": runtime_state["startup_error"],
    }


@app.get("/metadata")
def metadata() -> dict:
    try:
        model_metadata = get_model_metadata()
        class_names = model_metadata.class_names
        image_size = model_metadata.image_size
        backbone = model_metadata.backbone
        validation_split = model_metadata.validation_split
        metadata_error = None
    except ArtifactError as exc:
        class_names = []
        image_size = [224, 224]
        backbone = None
        validation_split = None
        metadata_error = str(exc)

    return {
        "ready": runtime_state["ready"],
        "class_names": class_names,
        "image_size": image_size,
        "backbone": backbone,
        "validation_split": validation_split,
        "disclaimer": DISCLAIMER,
        "error": runtime_state["startup_error"] or metadata_error,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    if not runtime_state["ready"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=runtime_state["startup_error"] or "Model is not ready yet.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename was provided.",
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
        predictor = get_predictor()
        return predictor.predict(content)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except ArtifactError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
