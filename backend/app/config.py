from __future__ import annotations

import os
import secrets
from dataclasses import dataclass
from pathlib import Path
from functools import lru_cache
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Explicitly load .env file from the backend directory
load_dotenv(PROJECT_ROOT / "backend" / ".env")


@dataclass(frozen=True)
class Settings:
    hf_model_id: str
    hf_token: str | None
    hf_chat_model: str
    database_url: str
    cloudinary_url: str | None
    cors_origins: list[str]
    max_upload_bytes: int
    # Auth
    jwt_secret: str
    jwt_algorithm: str
    jwt_expiry_hours: int
    scan_uploads_dir: Path


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    hf_model_id = os.getenv(
        "HF_MODEL_ID",
        "Jayanth2002/dinov2-base-finetuned-SkinDisease",
    )
    hf_token = os.getenv("HF_TOKEN") or None
    hf_chat_model = os.getenv(
        "HF_CHAT_MODEL",
        "mistralai/Mistral-7B-Instruct-v0.3",
    )

    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    cors_origins = [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]
    max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "10"))
    database_url = os.getenv("DATABASE_URL", "postgres://user:pass@localhost:5432/neurodermai")
    cloudinary_url = os.getenv("CLOUDINARY_URL")

    # JWT settings
    jwt_secret = os.getenv("JWT_SECRET", secrets.token_hex(32))
    jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expiry_hours = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    # Local Fallback
    backend_dir = PROJECT_ROOT / "backend"
    scan_uploads_dir = Path(os.getenv("SCAN_UPLOADS_DIR", str(backend_dir / "scan_uploads")))

    import cloudinary
    if cloudinary_url:
        cloudinary.config(cloudinary_url=cloudinary_url)

    return Settings(
        hf_model_id=hf_model_id,
        hf_token=hf_token,
        hf_chat_model=hf_chat_model,
        database_url=database_url,
        cloudinary_url=cloudinary_url,
        cors_origins=cors_origins,
        max_upload_bytes=max_upload_mb * 1024 * 1024,
        jwt_secret=jwt_secret,
        jwt_algorithm=jwt_algorithm,
        jwt_expiry_hours=jwt_expiry_hours,
        scan_uploads_dir=scan_uploads_dir,
    )
