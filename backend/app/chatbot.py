"""AI DermAssistant: Contextual skin condition Q&A via HuggingFace Inference Providers."""
from __future__ import annotations

import httpx
from typing import Any

from app.config import get_settings
from app.knowledge import CLASS_GUIDANCE, DISCLAIMER


# System prompt for the derm assistant
SYSTEM_PROMPT = """You are NeuroDermAI Assistant, a helpful and professional dermatology education assistant.

IMPORTANT RULES:
- You provide EDUCATIONAL information only, never diagnose or prescribe.
- Always remind users to consult a qualified dermatologist for medical advice.
- Keep responses concise (2-4 paragraphs max).
- Use clear, non-technical language when possible.
- If the user asks about something outside dermatology, politely redirect.
- Do NOT provide dosages or specific treatment plans.
- Be empathetic and reassuring in tone.

{context}

Answer the user's question based on your dermatology knowledge and the scan context above if provided."""


def _build_context_block(scan_result: dict[str, Any] | None) -> str:
    """Build context about the current scan for the AI."""
    if not scan_result:
        return "No scan has been performed yet. The user is asking a general dermatology question."

    predicted = scan_result.get("predicted_class", "Unknown")
    confidence = scan_result.get("confidence", 0)
    top_3 = scan_result.get("top_3", [])

    # Fetch guidance from knowledge base
    guidance = CLASS_GUIDANCE.get(predicted, {})
    explanation = guidance.get("explanation", "")
    precautions = guidance.get("precautions", [])

    top_3_text = ", ".join(
        f"{item['label']} ({item['probability']*100:.1f}%)" for item in top_3
    )

    return f"""SCAN CONTEXT (for reference only):
- Primary screening match: {predicted} ({confidence*100:.1f}% confidence)
- Top 3 candidates: {top_3_text}
- Condition summary: {explanation}
- General precautions: {'; '.join(precautions)}
- Disclaimer: {DISCLAIMER}"""


async def get_chat_response(
    user_message: str,
    conversation_history: list[dict[str, str]],
    scan_result: dict[str, Any] | None = None,
) -> str:
    """Send a message to HuggingFace Inference Provider (Cerebras) and return the response."""
    settings = get_settings()

    context_block = _build_context_block(scan_result)
    system_msg = SYSTEM_PROMPT.format(context=context_block)

    # Build OpenAI-compatible messages array
    messages = [{"role": "system", "content": system_msg}]

    # Add conversation history (last 6 exchanges to keep context manageable)
    for msg in conversation_history[-6:]:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", ""),
        })

    # Add current user message
    messages.append({"role": "user", "content": user_message})

    # Use HuggingFace Router -> Cerebras provider (free, fast, reliable)
    api_url = "https://router.huggingface.co/cerebras/v1/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.hf_token}",
    }

    payload = {
        "model": "llama3.1-8b",
        "messages": messages,
        "max_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.9,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(api_url, json=payload, headers=headers)

        if response.status_code == 503:
            return (
                "The AI assistant model is warming up. "
                "Please try again in about 20 seconds."
            )

        if response.status_code != 200:
            return (
                "I'm having trouble connecting to the AI service right now. "
                "Please try again shortly."
            )

        data = response.json()

        # OpenAI-compatible response format
        choices = data.get("choices", [])
        if choices:
            generated = choices[0].get("message", {}).get("content", "").strip()
        else:
            generated = ""

        if not generated:
            return (
                "I wasn't able to generate a response. "
                "Please try rephrasing your question."
            )

        return generated

    except httpx.TimeoutException:
        return (
            "The AI service took too long to respond. "
            "Please try again in a moment."
        )
    except Exception:
        return (
            "An unexpected error occurred. "
            "Please try again or consult a medical professional directly."
        )
