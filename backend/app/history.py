"""Scan history: save prediction results and retrieve user scan history."""
from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any

from app.config import get_settings
from app.database import get_db


async def save_scan(
    user_id: int,
    image_bytes: bytes,
    prediction_result: dict[str, Any],
) -> int:
    """Save a scan record and the image thumbnail. Returns the scan ID."""
    settings = get_settings()
    settings.scan_uploads_dir.mkdir(parents=True, exist_ok=True)

    # Save image to disk
    image_filename = f"{uuid.uuid4().hex}.jpg"
    image_path = settings.scan_uploads_dir / image_filename

    # Save a copy of the original image
    with open(image_path, "wb") as f:
        f.write(image_bytes)

    # Extract fields from prediction result
    predicted_class = prediction_result.get("predicted_class", "")
    confidence = prediction_result.get("confidence", 0.0)
    top_3 = prediction_result.get("top_3", [])
    explanation = prediction_result.get("explanation", "")
    precautions = prediction_result.get("precautions", [])
    disclaimer = prediction_result.get("disclaimer", "")

    db = await get_db()
    cursor = await db.execute(
        """INSERT INTO scans 
           (user_id, image_filename, predicted_class, confidence, top_3_json, explanation, precautions, disclaimer)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            user_id,
            image_filename,
            predicted_class,
            confidence,
            json.dumps(top_3),
            explanation,
            json.dumps(precautions),
            disclaimer,
        ),
    )
    await db.commit()
    return cursor.lastrowid


async def get_user_scans(
    user_id: int, limit: int = 20, offset: int = 0
) -> list[dict[str, Any]]:
    """Retrieve paginated scan history for a user."""
    db = await get_db()
    cursor = await db.execute(
        """SELECT id, image_filename, predicted_class, confidence, created_at
           FROM scans 
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?""",
        (user_id, limit, offset),
    )
    rows = await cursor.fetchall()

    return [
        {
            "id": row["id"],
            "image_filename": row["image_filename"],
            "predicted_class": row["predicted_class"],
            "confidence": row["confidence"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


async def get_scan_detail(
    user_id: int, scan_id: int
) -> dict[str, Any] | None:
    """Retrieve full details for a single scan."""
    db = await get_db()
    cursor = await db.execute(
        """SELECT id, image_filename, predicted_class, confidence, 
                  top_3_json, explanation, precautions, user_notes, disclaimer, created_at
           FROM scans 
           WHERE id = ? AND user_id = ?""",
        (scan_id, user_id),
    )
    row = await cursor.fetchone()
    if not row:
        return None

    top_3 = []
    if row["top_3_json"]:
        try:
            top_3 = json.loads(row["top_3_json"])
        except json.JSONDecodeError:
            pass

    precautions = []
    if row["precautions"]:
        try:
            precautions = json.loads(row["precautions"])
        except json.JSONDecodeError:
            pass

    return {
        "id": row["id"],
        "image_filename": row["image_filename"],
        "predicted_class": row["predicted_class"],
        "confidence": row["confidence"],
        "top_3": top_3,
        "explanation": row["explanation"],
        "precautions": precautions,
        "user_notes": row["user_notes"],
        "disclaimer": row["disclaimer"],
        "created_at": row["created_at"],
    }


async def update_scan_notes(
    user_id: int, scan_id: int, notes: str
) -> bool:
    """Update the user notes for a specific scan."""
    db = await get_db()
    cursor = await db.execute(
        "UPDATE scans SET user_notes = ? WHERE id = ? AND user_id = ?",
        (notes, scan_id, user_id),
    )
    await db.commit()
    return cursor.rowcount > 0


async def get_user_scan_count(user_id: int) -> int:
    """Return total number of scans for a user."""
    db = await get_db()
    cursor = await db.execute(
        "SELECT COUNT(*) as count FROM scans WHERE user_id = ?", (user_id,)
    )
    row = await cursor.fetchone()
    return row["count"] if row else 0
