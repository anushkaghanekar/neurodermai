import { getToken, clearToken } from "./auth";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

function authHeaders() {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function extractError(response) {
  // Auto-logout on expired/invalid token
  if (response.status === 401) {
    clearToken();
    window.location.hash = "#/auth";
    window.location.reload();
    return "Session expired. Please log in again.";
  }
  try {
    const payload = await response.json();
    return payload.detail || payload.message || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

// ---------- Prediction ----------
export async function predictSkinCondition(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}

// ---------- Metadata ----------
export async function fetchModelMetadata() {
  const response = await fetch(`${API_BASE_URL}/metadata`);

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}
// ---------- Auth ----------
export async function registerUser(email, password, name) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}

// ---------- History & Reports ----------
export async function fetchHistory(limit = 20, offset = 0) {
  const response = await fetch(
    `${API_BASE_URL}/history?limit=${limit}&offset=${offset}`,
    { headers: authHeaders() }
  );

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  const data = await response.json();
  // Ensure we consistently use image_url
  if (data.scans) {
    data.scans = data.scans.map(s => ({
      ...s,
      image_url: s.image_url || s.image_filename // backward compatibility during migration
    }));
  }
  return data;
}

export async function fetchScanDetail(scanId) {
  const response = await fetch(`${API_BASE_URL}/history/${scanId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  const data = await response.json();
  return {
    ...data,
    image_url: data.image_url || data.image_filename
  };
}

export async function updateScanNotes(scanId, notes) {
  const response = await fetch(`${API_BASE_URL}/history/${scanId}/notes`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_notes: notes }),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}

export async function downloadScanReport(scanId) {
  const response = await fetch(`${API_BASE_URL}/history/${scanId}/report`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NeuroDermAI-Report-${scanId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function getScanImageUrl(scan) {
  if (typeof scan === 'string') return scan; // direct URL string
  return scan.image_url || scan.image_filename;
}

// ---------- AI DermAssistant ----------
export async function sendChatMessage(message, history = [], scanContext = null) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
      scan_context: scanContext,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  return response.json();
}

export { API_BASE_URL };
