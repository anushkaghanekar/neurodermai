const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function extractError(response) {
  try {
    const payload = await response.json();
    return payload.detail || payload.message || "Prediction request failed.";
  } catch {
    return "Prediction request failed.";
  }
}

export async function predictSkinCondition(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}

export async function fetchModelMetadata() {
  const response = await fetch(`${API_BASE_URL}/metadata`);

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}

export { API_BASE_URL };
