from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Explicitly load .env file from the backend directory
load_dotenv(PROJECT_ROOT / "backend" / ".env")


@dataclass(frozen=True)
class Settings:
    hf_model_id: str
    hf_token: str | None
    cors_origins: list[str]
    max_upload_bytes: int


def get_settings() -> Settings:
    hf_model_id = os.getenv(
        "HF_MODEL_ID",
        "Jayanth2002/dinov2-base-finetuned-SkinDisease",
    )
    hf_token = os.getenv("HF_TOKEN") or None

    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    cors_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "10"))

    return Settings(
        hf_model_id=hf_model_id,
        hf_token=hf_token,
        cors_origins=cors_origins,
        max_upload_bytes=max_upload_mb * 1024 * 1024,
    )
