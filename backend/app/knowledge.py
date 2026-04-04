from __future__ import annotations


DISCLAIMER = (
    "NeuroDermAI is an educational image-classification tool and not a medical "
    "diagnosis system. Please consult a qualified clinician for any symptoms, "
    "persistent skin changes, pain, or treatment decisions."
)


CLASS_GUIDANCE: dict[str, dict[str, list[str] | str]] = {
    "acne": {
        "explanation": (
            "Acne commonly appears as clogged pores, inflamed bumps, blackheads, "
            "or whiteheads and can be aggravated by friction, hormones, or harsh products."
        ),
        "precautions": [
            "Clean the area gently and avoid aggressive scrubbing.",
            "Do not squeeze or pick active lesions because that can worsen scarring.",
            "Seek clinical advice if lesions are painful, cystic, widespread, or leaving marks.",
        ],
    },
    "eczema": {
        "explanation": (
            "Eczema often presents with dry, itchy, irritated, or inflamed patches and "
            "may flare with irritants, allergens, or weather changes."
        ),
        "precautions": [
            "Use fragrance-free moisturizers and mild cleansers.",
            "Try to avoid scratching because it can break the skin barrier.",
            "Get medical advice if the rash is severe, infected, or not improving.",
        ],
    },
    "psoriasis": {
        "explanation": (
            "Psoriasis can cause sharply defined, scaly, or thickened plaques and is "
            "usually driven by immune-related inflammation."
        ),
        "precautions": [
            "Keep skin moisturized and avoid picking off scales.",
            "Track possible triggers such as stress, skin injury, or illness.",
            "See a dermatologist if plaques are spreading, painful, or affecting daily life.",
        ],
    },
    "fungal": {
        "explanation": (
            "Fungal skin infections may cause ring-shaped, itchy, flaky, discolored, "
            "or spreading patches, especially in warm and moist areas."
        ),
        "precautions": [
            "Keep the area clean and dry and avoid sharing towels or clothing.",
            "Change out of sweaty clothes promptly.",
            "Seek care if the rash is spreading, painful, or involving nails or scalp.",
        ],
    },
    "warts": {
        "explanation": (
            "Warts are small growths caused by certain human papillomavirus strains and "
            "may have a rough surface or interrupt normal skin lines."
        ),
        "precautions": [
            "Avoid picking or shaving over the area because warts can spread.",
            "Keep communal surfaces and shared tools clean.",
            "Get medical advice if the lesion is painful, bleeding, or rapidly changing.",
        ],
    },
    "normal": {
        "explanation": (
            "The model did not detect a strong pattern for the supported common skin "
            "conditions in this image."
        ),
        "precautions": [
            "Continue monitoring the skin area for new or changing symptoms.",
            "Retake the photo in bright, even lighting if the result seems uncertain.",
            "Speak with a clinician if you still have symptoms or concerns.",
        ],
    },
}


def get_guidance(label: str) -> dict[str, list[str] | str]:
    normalized = label.lower()
    if normalized in CLASS_GUIDANCE:
        return CLASS_GUIDANCE[normalized]

    return {
        "explanation": (
            "The model detected a skin pattern in this image, but no tailored educational "
            "guidance is configured for that label."
        ),
        "precautions": [
            "Retake the image with better lighting if the result seems unclear.",
            "Consult a qualified clinician for any persistent or worsening symptoms.",
        ],
    }
