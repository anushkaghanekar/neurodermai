from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _resolve_project_path(raw_path: str, default: Path) -> Path:
    candidate = Path(raw_path).expanduser()
    if candidate.is_absolute():
        return candidate
    return (PROJECT_ROOT / raw_path).resolve() if raw_path else default.resolve()


@dataclass(frozen=True)
class Settings:
    model_path: Path
    labels_path: Path
    cors_origins: list[str]
    max_upload_bytes: int


def get_settings() -> Settings:
    default_model_path = (PROJECT_ROOT / "model" / "model.h5").resolve()
    default_labels_path = (PROJECT_ROOT / "model" / "labels.json").resolve()

    model_path = _resolve_project_path(
        os.getenv("MODEL_PATH", "model/model.h5"),
        default_model_path,
    )
    labels_path = _resolve_project_path(
        os.getenv("LABELS_PATH", "model/labels.json"),
        default_labels_path,
    )

    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    cors_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "10"))

    return Settings(
        model_path=model_path,
        labels_path=labels_path,
        cors_origins=cors_origins,
        max_upload_bytes=max_upload_mb * 1024 * 1024,
    )
