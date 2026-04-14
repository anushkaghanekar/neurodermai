from __future__ import annotations

import httpx
from io import BytesIO
from typing import Any

from PIL import Image, UnidentifiedImageError

from app.config import Settings, get_settings
from app.knowledge import DISCLAIMER, get_guidance


# HuggingFace Inference API endpoint (new router format)
HF_API_URL = "https://router.huggingface.co/hf-inference/models/{model_id}"

# Magic byte signatures for supported image formats.
_IMAGE_MAGIC = [
    (b"\xff\xd8\xff", "JPEG"),
    (b"\x89PNG\r\n\x1a\n", "PNG"),
    (b"RIFF", "WebP"),
    (b"GIF87a", "GIF"),
    (b"GIF89a", "GIF"),
    (b"BM", "BMP"),
    (b"II", "TIFF"),
    (b"MM", "TIFF"),
]


class HuggingFaceError(RuntimeError):
    """Raised when the HuggingFace API returns an error."""


def validate_image_bytes(content: bytes) -> None:
    """Validate that raw bytes look like a real image file."""
    if len(content) < 8:
        raise ValueError("Uploaded file is too small to be a valid image.")

    for magic, _fmt in _IMAGE_MAGIC:
        if content[: len(magic)] == magic:
            return

    raise ValueError(
        "Uploaded file does not appear to be a supported image format. "
        "Please upload a JPEG, PNG, WebP, GIF, BMP, or TIFF file."
    )


def _verify_readable_image(content: bytes) -> None:
    """Verify PIL can actually decode the image bytes."""
    try:
        img = Image.open(BytesIO(content))
        img.verify()
    except UnidentifiedImageError as exc:
        raise ValueError("Uploaded file is not a valid image.") from exc
    except Exception as exc:
        raise ValueError(
            "Could not open the uploaded file as an image. "
            "The file may be corrupted or in an unsupported format."
        ) from exc


async def predict_with_huggingface(
    image_bytes: bytes,
    settings: Settings,
) -> dict[str, Any]:
    """Send an image to the HuggingFace Inference API and return structured results."""

    # Validate image before sending
    validate_image_bytes(image_bytes)
    _verify_readable_image(image_bytes)

    url = HF_API_URL.format(model_id=settings.hf_model_id)

    headers: dict[str, str] = {}
    if settings.hf_token:
        headers["Authorization"] = f"Bearer {settings.hf_token}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            content=image_bytes,
            headers={
                **headers,
                "Content-Type": "application/octet-stream",
            },
        )

    if response.status_code == 401:
        raise HuggingFaceError(
            "HuggingFace API authentication failed. Set a valid HF_TOKEN in your environment."
        )
    if response.status_code == 503:
        # Model is loading
        body = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
        estimated = body.get("estimated_time", "unknown")
        raise HuggingFaceError(
            f"The model is currently loading on HuggingFace servers. "
            f"Estimated wait: {estimated}s. Please try again in a moment."
        )
    if response.status_code != 200:
        detail = response.text[:300]
        raise HuggingFaceError(
            f"HuggingFace API returned status {response.status_code}: {detail}"
        )

    # Parse response: list of {label, score} dicts, sorted by score descending
    raw_predictions = response.json()
    if not isinstance(raw_predictions, list) or len(raw_predictions) == 0:
        raise HuggingFaceError(
            "Unexpected response format from HuggingFace API."
        )

    # Build structured output
    ranked = [
        {"label": item["label"], "probability": round(float(item["score"]), 6)}
        for item in raw_predictions
    ]
    ranked.sort(key=lambda x: x["probability"], reverse=True)

    top_prediction = ranked[0]
    guidance = get_guidance(top_prediction["label"])

    probability_map = {item["label"]: item["probability"] for item in ranked}

    return {
        "predicted_class": top_prediction["label"],
        "confidence": top_prediction["probability"],
        "top_3": ranked[:3],
        "probabilities": probability_map,
        "all_class_probabilities": probability_map,
        "explanation": guidance["explanation"],
        "precautions": guidance["precautions"],
        "disclaimer": DISCLAIMER,
    }
