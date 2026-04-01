/**
 * apiClient — production-grade HTTP client
 *
 * Features:
 * - Auto-attach Authorization header
 * - Centralized error handling với typed errors
 * - Token refresh với queue (tránh race condition)
 * - Request timeout
 * - Retry on network failure (không retry 4xx)
 */

import { fetchAuthSession, markSessionExpired } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

// ─── Auth logout callback (set bởi Redux store sau khi init) ─────────────────
let _onAuthExpired = null;
export const setAuthExpiredCallback = (cb) => { _onAuthExpired = cb; };

// ─── Request failure callback (toast/message toàn cục) ────────────────────────
let _onRequestFailed = null;
export const setRequestFailedCallback = (cb) => { _onRequestFailed = cb; };

// ─── Typed Errors ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;   // HTTP status code
    this.code = code;       // BE error code nếu có
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends ApiError {
  constructor(message) {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthError';
  }
}

// ─── Token Refresh Queue ─────────────────────────────────────────────────────
// Khi token hết hạn và nhiều request cùng lúc, chỉ refresh 1 lần,
// các request còn lại chờ trong queue.

let _refreshPromise = null;

const getValidSession = async () => {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetchAuthSession().finally(() => { _refreshPromise = null; });
  return _refreshPromise;
};

// ─── Core Request ─────────────────────────────────────────────────────────────

const buildHeaders = (session, extra = {}) => ({
  'Content-Type': 'application/json',
  ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
  ...extra,
});

const parseResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
};

const notifyRequestFailed = (message) => {
  if (!message) return;
  _onRequestFailed?.(message);
};

const request = async (method, path, { body, headers: extraHeaders = {}, timeout = DEFAULT_TIMEOUT_MS, _retry = 0 } = {}) => {
  if (!API_URL) throw new NetworkError('VITE_API_URL chưa được cấu hình');

  const session = await getValidSession();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: buildHeaders(session, extraHeaders),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new NetworkError('Request timeout');
    // Retry on network failure
    if (_retry < MAX_RETRIES) {
      await delay(300 * (_retry + 1));
      return request(method, path, { body, headers: extraHeaders, timeout, _retry: _retry + 1 });
    }
    const networkError = new NetworkError(err.message || 'Network error');
    notifyRequestFailed(networkError.message);
    throw networkError;
  }
  clearTimeout(timer);

  // 401 — token có thể đã hết hạn giữa chừng, thử refresh 1 lần
  if (res.status === 401 && _retry === 0) {
    // Force-expire session để fetchAuthSession trigger refresh (giữ refreshToken)
    markSessionExpired();
    const refreshed = await fetchAuthSession();
    if (refreshed?.accessToken) {
      return request(method, path, { body, headers: extraHeaders, timeout, _retry: 1 });
    }
    _onAuthExpired?.();
    throw new AuthError('Phiên đăng nhập hết hạn');
  }

  if (!res.ok) {
    let errBody = {};
    try { errBody = await res.json(); } catch { /* ignore */ }
    const apiError = new ApiError(
      errBody.error || errBody.message || `HTTP ${res.status}`,
      res.status,
      errBody.code,
    );
    notifyRequestFailed(apiError.message);
    throw apiError;
  }

  // 204 No Content
  if (res.status === 204) return null;

  return parseResponse(res);
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Public API ───────────────────────────────────────────────────────────────

export const apiClient = {
  get:    (path, opts)       => request('GET',    path, opts),
  post:   (path, body, opts) => request('POST',   path, { ...opts, body }),
  put:    (path, body, opts) => request('PUT',    path, { ...opts, body }),
  patch:  (path, body, opts) => request('PATCH',  path, { ...opts, body }),
  delete: (path, opts)       => request('DELETE', path, opts),
};

export default apiClient;
