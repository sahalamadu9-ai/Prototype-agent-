const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Backend endpoints return either a bare payload (orchestrator tasks) or an
 * apiSuccess envelope `{ success, data }` (workspaces, projects, content).
 * Unwrap the envelope here so every page receives the plain value it expects.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('zapcart_token') : null;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || `Invalid response from server (${response.status})`);
  }

  if (!response.ok) {
    const message =
      payload?.error?.message || payload?.error || payload?.message || text || `Request failed: ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    if (!payload.success) {
      throw new Error(payload.error?.message || 'Request failed');
    }
    return payload.data as T;
  }

  return payload as T;
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('zapcart_token', token);
  } else {
    localStorage.removeItem('zapcart_token');
  }
}

export default API_BASE_URL;
