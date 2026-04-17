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
      idToken: data.idToken || session.idToken,
      expiresAt: Date.now() + 3_600_000, // Cognito access token mặc định 1 giờ
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

export const updateSessionUser = (newUser) => {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return;
  try {
    const session = JSON.parse(raw);
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...session, user: newUser }));
  } catch { /* ignore */ }
};

/**
 * Kiểm tra user đăng nhập có phải là artist không
 * Gọi endpoint /me/artist-request để lấy artist profile
 * Nếu có => lưu artist data vào localStorage + cập nhật session user role thành artist
 * Return: artistData nếu là artist, null nếu không
 */
export const checkAndSaveArtistProfile = async (userId) => {
  if (!API_URL || !userId) return null;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/artists?userId=${encodeURIComponent(userId)}`, { headers });
    if (!res.ok) {
      localStorage.removeItem(`spotify_artist_${userId}`);
      return null;
    }

    const artists = await res.json();
    const artistData = Array.isArray(artists) ? artists[0] : artists?.items?.[0] || null;
    if (!artistData || !artistData.id) {
      localStorage.removeItem(`spotify_artist_${userId}`);
      return null;
    }

    localStorage.setItem(
      `spotify_artist_${userId}`,
      JSON.stringify({
        id: artistData.id,
        userId: artistData.userId,
        name: artistData.name,
        bio: artistData.bio || '',
        photoUrl: artistData.photoUrl || null,
        isVerified: artistData.isVerified ?? false, // lưu để ProfilePage biết trạng thái xác minh
        createdAt: artistData.createdAt,
        updatedAt: artistData.updatedAt,
      })
    );

    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) {
      try {
        const session = JSON.parse(raw);
        session.user = {
          ...session.user,
          role: ROLES.ARTIST,
          artist_id: artistData.id,
          isVerified: artistData.isVerified ?? false,
        };
        saveSession(session);
      } catch { /* ignore */ }
    }

    return artistData;
  } catch {
    localStorage.removeItem(`spotify_artist_${userId}`);
    return null;
  }
};

/**
 * Lấy artist profile từ localStorage
 */
export const getArtistProfileFromStorage = (userId) => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`spotify_artist_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (email) => {
  if (!API_URL) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email.includes('@')) { reject(new Error('Email không hợp lệ')); return; }
        resolve({ message: 'Nếu email tồn tại trong hệ thống, mã OTP đã được gửi đến email của bạn' });
      }, 800);
    });
  }
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Đã có lỗi xảy ra, vui lòng thử lại');
  return data;
};

export const confirmForgotPassword = async (email, code, newPassword) => {
  if (!API_URL) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (newPassword.length < 8) { reject(new Error('Mật khẩu tối thiểu 8 ký tự')); return; }
        resolve({ message: 'Đặt lại mật khẩu thành công' });
      }, 800);
    });
  }
  const res = await fetch(`${API_URL}/auth/confirm-forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Đã có lỗi xảy ra, vui lòng thử lại');
  return data;
};
