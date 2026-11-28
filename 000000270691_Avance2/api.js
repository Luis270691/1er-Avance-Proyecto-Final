const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";
const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isTokenExpired(token = getToken()) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return exp ? exp * 1000 < Date.now() : false;
  } catch {
    return false;
  }
}

function hasSession() {
  if (!getToken()) return false;
  if (isTokenExpired()) {
    clearSession();
    return false;
  }
  return true;
}

function requireAuth() {
  if (hasSession()) return true;
  location.replace("index.html");
  return false;
}

async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth) headers["auth-token"] = getToken();

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Error ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return data;
}

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `alert ${type}`;
  element.hidden = false;
}

function hideMessage(element) {
  element.hidden = true;
}
