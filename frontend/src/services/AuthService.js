import { ROLES } from '../constants/enums';

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'spotify_auth_session';

const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

const getRoleFromClaims = (claims = {}) => {
  const rawGroups = claims['cognito:groups'];
  let groups = [];

  if (Array.isArray(rawGroups)) {
    groups = rawGroups;
  } else if (typeof rawGroups === 'string') {
    groups = rawGroups
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
  }

  if (groups.includes('admin')) return ROLES.ADMIN;
  if (groups.includes('artist')) return ROLES.ARTIST;
  return ROLES.USER;
};

const buildUserFromClaims = (claims = {}, fallback = {}) => {
  const email = claims.email || fallback.email || '';
  const nameFromToken = claims.name || claims.displayName;
  const usernameFromEmail = email ? email.split('@')[0] : '';
  const name = nameFromToken || fallback.name || fallback.username || usernameFromEmail || 'Spotify User';
  const userId = claims.sub || fallback.user_id || fallback.id || '';

  return {
    id: userId,
    user_id: userId,
    email,
    username: fallback.username || usernameFromEmail || name,
    name,
    role: getRoleFromClaims(claims),
    avatar_url: fallback.avatar_url || claims.picture || null,
    isVerified: getRoleFromClaims(claims) !== ROLES.USER,
  };
};

const getExpiresAt = (accessToken) => {
  const claims = decodeJwtPayload(accessToken);
  if (claims?.exp) return claims.exp * 1000;
  return Date.now() + 10 * 60 * 1000;
};

const loadSession = () => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveSession = (session) => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  return session;
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const parseError = async (response, fallbackMessage) => {
  try {
    const data = await response.json();
    return data.error || data.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await parseError(response, 'Yêu cầu thất bại');
    throw new Error(message);
  }

  return response.json();
};

const fetchMeWithToken = async (accessToken) => {
  if (!API_URL || !accessToken) return null;
  try {
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

export const confirmAccount = async (email, code) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, message: 'Xác nhận thành công (mock)' }), 500)
    );
  }

  return requestJson('/auth/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
};

export const refreshToken = async (refreshTokenValue) => {
  if (!API_URL) {
    return {
      accessToken: 'mock_access_token',
      idToken: 'mock_id_token',
    };
  }

  return requestJson('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
};

export const fetchAuthSession = async () => {
  const current = loadSession();
  if (!current?.accessToken) return null;

  const now = Date.now();
  if (current.expiresAt && current.expiresAt > now) return current;
  if (!current.refreshToken) {
    clearSession();
    return null;
  }

  try {
    const refreshed = await refreshToken(current.refreshToken);
    const nextSession = {
      ...current,
      accessToken: refreshed.accessToken,
      idToken: refreshed.idToken || current.idToken,
      expiresAt: getExpiresAt(refreshed.accessToken),
      user: buildUserFromClaims(decodeJwtPayload(refreshed.idToken || current.idToken), current.user),
    };
    return saveSession(nextSession);
  } catch {
    clearSession();
    return null;
  }
};

export const getAuthToken = async () => {
  const session = await fetchAuthSession();
  return session?.accessToken || null;
};

export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const getCurrentUser = async () => {
  const session = await fetchAuthSession();
  if (!session) return null;
  if (session.user) return session.user;

  const meData = await fetchMeWithToken(session.accessToken);
  const claims = decodeJwtPayload(session.idToken || session.accessToken) || {};
  const user = buildUserFromClaims(claims, {
    id: meData?.id,
    user_id: meData?.id,
    email: meData?.email,
    name: meData?.displayName,
    username: meData?.displayName,
    avatar_url: meData?.avatarUrl || null,
  });

  saveSession({ ...session, user });
  return user;
};

export const login = async (email, password) => {
  if (!API_URL) {
    throw new Error('Thiếu VITE_API_URL. Không thể đăng nhập backend thật.');
  }

  const tokens = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const meData = await fetchMeWithToken(tokens.accessToken);
  const claims = decodeJwtPayload(tokens.idToken || tokens.accessToken) || {};
  const user = buildUserFromClaims(claims, {
    id: meData?.id,
    user_id: meData?.id,
    email: meData?.email || email,
    name: meData?.displayName,
    username: meData?.displayName,
    avatar_url: meData?.avatarUrl || null,
  });

  saveSession({
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken,
    expiresAt: getExpiresAt(tokens.accessToken),
    user,
  });

  return user;
};

export const register = async (username, email, password) => {
  if (!API_URL) {
    throw new Error('Thiếu VITE_API_URL. Không thể đăng ký backend thật.');
  }

  await requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      displayName: username,
    }),
  });

  try {
    return await login(email, password);
  } catch {
    throw new Error('Đăng ký thành công. Vui lòng xác nhận email trước khi đăng nhập.');
  }
};

export const logoutUser = async () => {
  const session = loadSession();
  if (API_URL && session?.accessToken) {
    try {
      await requestJson('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ accessToken: session.accessToken }),
      });
    } catch {
      // clear session locally even if backend logout fails
    }
  }
  clearSession();
};