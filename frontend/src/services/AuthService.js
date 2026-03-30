/**
 * AuthService — Cognito auth qua BE API.
 * Fallback về mock khi không có VITE_API_URL.
 */
import { ROLES } from '../constants/enums';
import { adaptUser } from './adapters';

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'spotify_auth';

// ─── Mock Accounts ────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS = {
  'user@test.com':   { id: 'USER_001', user_id: 'USER_001', username: 'Spotify User',  name: 'Spotify User',  email: 'user@test.com',   role: ROLES.USER,   isVerified: false, avatar_url: 'https://i.pravatar.cc/150?img=11' },
  'artist@test.com': { id: 'USER_002', user_id: 'USER_002', username: 'Artist Test',   name: 'Artist Test',   email: 'artist@test.com', role: ROLES.ARTIST, isVerified: true,  avatar_url: 'https://i.pravatar.cc/150?img=12' },
  'admin@test.com':  { id: 'USER_003', user_id: 'USER_003', username: 'Admin',         name: 'Admin',         email: 'admin@test.com',  role: ROLES.ADMIN,  isVerified: true,  avatar_url: 'https://i.pravatar.cc/150?img=13' },
};

// ─── Session Storage ──────────────────────────────────────────────────────────

const saveSession = (data) => localStorage.setItem(TOKEN_KEY, JSON.stringify(data));

export const clearSession = () => localStorage.removeItem(TOKEN_KEY);

// ─── Session / Token ──────────────────────────────────────────────────────────

export const fetchAuthSession = async () => {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;

  let session;
  try { session = JSON.parse(raw); } catch { clearSession(); return null; }

  // Token còn hạn
  if (!session.expiresAt || Date.now() < session.expiresAt) return session;

  // Hết hạn — thử refresh
  if (!session.refreshToken || !API_URL) { clearSession(); return null; }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!res.ok) { clearSession(); return null; }
    const data = await res.json();
    const updated = {
      ...session,
      accessToken: data.accessToken,
      expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
    };
    saveSession(updated);
    return updated;
  } catch {
    clearSession();
    return null;
  }
};

export const getAuthToken = async () => {
  const session = await fetchAuthSession();
  return session?.accessToken ?? null;
};

export const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getCurrentUser = async () => {
  const session = await fetchAuthSession();
  return session?.user ?? null;
};

// ─── Auth Functions ───────────────────────────────────────────────────────────

export const register = async (displayName, email, password) => {
  if (!API_URL) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email.includes('@')) { reject(new Error('Email không hợp lệ!')); return; }
        const userData = {
          user_id: `USER_${Math.floor(Math.random() * 1000)}`,
          username: displayName, email,
          avatar_url: 'https://i.pravatar.cc/150?img=12',
        };
        saveSession({ user: userData, accessToken: 'mock_' + Date.now(), refreshToken: 'mock_refresh', expiresAt: Date.now() + 3_600_000 });
        resolve(userData);
      }, 800);
    });
  }
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
  return data;
};

export const confirmRegister = async (email, code) => {
  if (!API_URL) return { success: true };
  const res = await fetch(`${API_URL}/auth/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Xác nhận thất bại');
  return data;
};

export const login = async (email, password) => {
  if (!API_URL) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const account = MOCK_ACCOUNTS[email];
        if (!account) { reject(new Error('Tài khoản không tồn tại')); return; }
        saveSession({ user: account, accessToken: 'mock_' + Date.now(), refreshToken: 'mock_refresh', expiresAt: Date.now() + 3_600_000 });
        resolve(account);
      }, 800);
    });
  }
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');

  const idTokenPayload = JSON.parse(atob(data.idToken.split('.')[1]));
  const user = adaptUser({
    userId: idTokenPayload.sub,
    email: idTokenPayload.email || email,
    displayName: idTokenPayload.name || idTokenPayload.email || email,
    role: (idTokenPayload['cognito:groups'] || [])[0] || 'listener',
    avatarUrl: null,
  });
  saveSession({
    user,
    accessToken: data.accessToken,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + 3_600_000,
  });
  return user;
};

export const logoutUser = async () => {
  if (API_URL) {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers });
    } catch { /* ignore */ }
  }
  clearSession();
};
