// Backend REST API mijozi. Barcha javoblar { ok, data } | { ok, error } formatida.

const API_BASE = `${(window.PHYSICA_CONFIG?.apiBase ?? '').replace(/\/$/, '')}/api/v1`;
const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(code, message, status = 0, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let token = null;
let reauthenticate = null; // sessiya tugaganda chaqiriladigan funksiya (auth.js o'rnatadi)

export function setToken(value) {
  token = value;
}
export function onSessionExpired(fn) {
  reauthenticate = fn;
}

async function send(method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Tarmoq xatosi');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* JSON bo'lmagan javob */
  }
  if (!response.ok || !payload?.ok) {
    const err = payload?.error ?? {};
    throw new ApiError(err.code ?? 'HTTP_ERROR', err.message ?? `HTTP ${response.status}`, response.status, err.details);
  }
  return payload.data;
}

async function request(method, path, body) {
  try {
    return await send(method, path, body);
  } catch (err) {
    // Sessiya tugagan bo'lsa bir marta qayta autentifikatsiya qilib ko'ramiz
    const expired = err instanceof ApiError && (err.code === 'SESSION_EXPIRED' || err.code === 'INVALID_SESSION');
    if (expired && reauthenticate && !path.startsWith('/auth/')) {
      await reauthenticate();
      return send(method, path, body);
    }
    throw err;
  }
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
};
