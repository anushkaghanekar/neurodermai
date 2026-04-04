from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, UnidentifiedImageError
from tensorflow import keras
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

from app.config import Settings, get_settings
from app.knowledge import DISCLAIMER, get_guidance


IMAGE_SIZE = (224, 224)


class ArtifactError(RuntimeError):
    """Raised when the trained model artifacts are missing or invalid."""


@dataclass(frozen=True)
class ModelMetadata:
    class_names: list[str]
    image_size: list[int]
    backbone: str | None
    validation_split: float | None


def _load_labels_payload(labels_path: Path) -> Any:
    if not labels_path.exists():
        raise ArtifactError(
            f"Label mapping not found at {labels_path}. Download labels.json from Kaggle "
            "and place it in the model directory before starting the backend."
        )

    with labels_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _load_class_names(labels_path: Path) -> list[str]:
    payload = _load_labels_payload(labels_path)

    if isinstance(payload, dict) and isinstance(payload.get("class_names"), list):
        class_names = payload["class_names"]
    elif isinstance(payload, list):
        class_names = payload
    else:
        raise ArtifactError(
            "labels.json must contain either a JSON array of labels or an object with "
            "a 'class_names' array."
        )

    if not class_names:
        raise ArtifactError("labels.json does not contain any classes.")

    return [str(class_name) for class_name in class_names]


def get_model_metadata() -> ModelMetadata:
    settings = get_settings()
    payload = _load_labels_payload(settings.labels_path)
    class_names = _load_class_names(settings.labels_path)

    if isinstance(payload, dict):
        image_size = payload.get("image_size", list(IMAGE_SIZE))
        backbone = payload.get("backbone")
        validation_split = payload.get("validation_split")
    else:
        image_size = list(IMAGE_SIZE)
        backbone = None
        validation_split = None

    return ModelMetadata(
        class_names=class_names,
        image_size=[int(value) for value in image_size],
        backbone=str(backbone) if backbone else None,
        validation_split=float(validation_split) if validation_split is not None else None,
    )


def _load_model(model_path: Path) -> keras.Model:
    if not model_path.exists():
        raise ArtifactError(
            f"Model file not found at {model_path}. Train the notebook on Kaggle, "
            "download /kaggle/working/model.h5, and place it in the model directory."
        )

    return keras.models.load_model(model_path)


@lru_cache(maxsize=1)
def get_predictor() -> "Predictor":
    settings = get_settings()
    model = _load_model(settings.model_path)
    class_names = _load_class_names(settings.labels_path)
    return Predictor(model=model, class_names=class_names)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Uploaded file is not a valid image.") from exc

    image = image.resize(IMAGE_SIZE)
    image_array = np.asarray(image, dtype=np.float32)
    image_array = preprocess_input(image_array)
    return np.expand_dims(image_array, axis=0)


class Predictor:
    def __init__(self, model: keras.Model, class_names: list[str]) -> None:
        self.model = model
        self.class_names = class_names

    def predict(self, image_bytes: bytes) -> dict[str, Any]:
        input_tensor = preprocess_image(image_bytes)
        probabilities = self.model.predict(input_tensor, verbose=0)[0]

        if len(probabilities) != len(self.class_names):
            raise ArtifactError(
                "Model output shape does not match labels.json. Re-export both files "
                "from the same Kaggle training run."
            )

        probability_map = {
            label: round(float(score), 6)
            for label, score in zip(self.class_names, probabilities)
        }

        ranked = sorted(
            (
                {"label": label, "probability": round(float(score), 6)}
                for label, score in zip(self.class_names, probabilities)
            ),
            key=lambda item: item["probability"],
            reverse=True,
        )

        top_prediction = ranked[0]
        guidance = get_guidance(top_prediction["label"])

        return {
            "prediction": top_prediction["label"],
            "confidence": top_prediction["probability"],
            "top_3": ranked[:3],
            "probabilities": probability_map,
            "explanation": guidance["explanation"],
            "precautions": guidance["precautions"],
            "disclaimer": DISCLAIMER,
        }


def warmup_model() -> None:
    get_predictor()


def get_runtime_settings() -> Settings:
    return get_settings()
