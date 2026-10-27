const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6001/api';
const TOKEN_KEY = 'token';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY) || '';
}

export function saveToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }

  const token = getToken();
  const response = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new ApiError('The API returned an invalid response.', response.status);
      }
    }
  }

  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}
