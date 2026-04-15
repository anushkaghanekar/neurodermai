"""Scan history: save prediction results and retrieve user scan history."""
from __future__ import annotations

import json
import asyncio
import cloudinary.uploader
from typing import Any

from app.config import get_settings
from app.database import get_db


async def _upload_to_cloudinary(image_bytes: bytes) -> str:
    """Upload image to Cloudinary and return the secure URL."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: cloudinary.uploader.upload(
            image_bytes,
            folder="neurodermai_scans",
            resource_type="image"
        )
    )
    return result["secure_url"]


async def save_scan(
    user_id: int,
    image_bytes: bytes,
    prediction_result: dict[str, Any],
) -> int:
    """Save a scan record and upload the image to Cloudinary. Returns the scan ID."""
    settings = get_settings()
    
    # Upload to Cloudinary if configured, else fallback to local placeholder (for robustness)
    if settings.cloudinary_url:
        image_url = await _upload_to_cloudinary(image_bytes)
    else:
        # Fallback placeholder (this shouldn't happen in production)
        image_url = "https://via.placeholder.com/400x400.png?text=Cloudinary+Not+Configured"

    # Extract fields from prediction result
    predicted_class = prediction_result.get("predicted_class", "")
    confidence = prediction_result.get("confidence", 0.0)
    top_3 = prediction_result.get("top_3", [])
    explanation = prediction_result.get("explanation", "")
    precautions = prediction_result.get("precautions", [])
    disclaimer = prediction_result.get("disclaimer", "")

    pool = await get_db()
    async with pool.acquire() as db:
        scan_id = await db.fetchval(
            """INSERT INTO scans 
               (user_id, image_url, predicted_class, confidence, top_3_json, explanation, precautions, disclaimer)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               RETURNING id""",
            user_id,
            image_url,
            predicted_class,
            confidence,
            json.dumps(top_3),
            explanation,
            json.dumps(precautions),
            disclaimer,
        )
    return scan_id


async def get_user_scans(
    user_id: int, limit: int = 20, offset: int = 0
) -> list[dict[str, Any]]:
    """Retrieve paginated scan history for a user."""
    pool = await get_db()
    async with pool.acquire() as db:
        rows = await db.fetch(
            """SELECT id, image_url, predicted_class, confidence, created_at
               FROM scans 
               WHERE user_id = $1
               ORDER BY created_at DESC
               LIMIT $2 OFFSET $3""",
            user_id, limit, offset
        )

    return [
        {
            "id": row["id"],
            "image_url": row["image_url"],
            "predicted_class": row["predicted_class"],
            "confidence": row["confidence"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }
        for row in rows
    ]


async def get_scan_detail(
    user_id: int, scan_id: int
) -> dict[str, Any] | None:
    """Retrieve full details for a single scan."""
    pool = await get_db()
    async with pool.acquire() as db:
        row = await db.fetchrow(
            """SELECT id, image_url, predicted_class, confidence, 
                      top_3_json, explanation, precautions, user_notes, disclaimer, created_at
               FROM scans 
               WHERE id = $1 AND user_id = $2""",
            scan_id, user_id
        )
    
    if not row:
        return None

    # asyncpg handles JSONB automatically if passed as dict/list, 
    # but since we stored them via json.dumps (for safety) or if the DB returns strings:
    def _parse_json(val):
        if isinstance(val, (list, dict)):
            return val
        if isinstance(val, str):
            try:
                return json.loads(val)
            except:
                return []
        return []

    return {
        "id": row["id"],
        "image_url": row["image_url"],
        "predicted_class": row["predicted_class"],
        "confidence": row["confidence"],
        "top_3": _parse_json(row["top_3_json"]),
        "explanation": row["explanation"],
        "precautions": _parse_json(row["precautions"]),
        "user_notes": row["user_notes"],
        "disclaimer": row["disclaimer"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


async def update_scan_notes(
    user_id: int, scan_id: int, notes: str
) -> bool:
    """Update the user notes for a specific scan."""
    pool = await get_db()
    async with pool.acquire() as db:
        result = await db.execute(
            "UPDATE scans SET user_notes = $1 WHERE id = $2 AND user_id = $3",
            notes, scan_id, user_id
        )
    # result is a string like "UPDATE 1"
    return result.startswith("UPDATE") and " 0" not in result


async def get_user_scan_count(user_id: int) -> int:
    """Return total number of scans for a user."""
    pool = await get_db()
    async with pool.acquire() as db:
        count = await db.fetchval(
            "SELECT COUNT(*) FROM scans WHERE user_id = $1", user_id
        )
    return count if count else 0
