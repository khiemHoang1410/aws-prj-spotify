import api from './apiClient';
import { adaptUser } from './adapters';

// ─── Mock (chỉ dùng khi không có VITE_API_URL) ────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;

const MOCK_PROFILE = {
  user_id: 'USER_001',
  username: 'Spotify Lover',
  email: 'user@test.com',
  avatar_url: 'https://i.pravatar.cc/150?img=11',
};

const mockDelay = (data, ms = 300) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

// ─── API ──────────────────────────────────────────────────────────────────────

export const getUserProfile = async (userId) => {
  if (!API_URL) return mockDelay(MOCK_PROFILE);
  const data = await api.get(`/users/${userId}`);
  return adaptUser(data);
};

export const getProfile = async () => {
  if (!API_URL) return mockDelay(MOCK_PROFILE);
  const data = await api.get('/me');
  return adaptUser(data);
};

export const updateProfile = async (payload) => {
  if (!API_URL) return mockDelay({ success: true, data: { ...MOCK_PROFILE, ...payload } }, 600);
  return api.put('/me', payload);
};

export const requestArtistVerify = async (formData) => {
  if (!API_URL) return mockDelay({ success: true, message: 'Yêu cầu đã được gửi' }, 1000);
  return api.post('/me/artist-request', formData);
};

export const getPlayHistory = async (userId) => {
  if (!API_URL) return mockDelay([]);
  return api.get(`/users/${userId}/play-history`);
};
