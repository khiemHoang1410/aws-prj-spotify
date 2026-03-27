import { getAuthHeaders } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK DATA
// ==========================================
const mockStats = {
  totalSongs: 8,
  verifiedArtists: 1,
  pendingReports: 2,
  totalUsers: 3,
};

const mockArtistRequests = [
  {
    id: 'AR001',
    userId: 'USER_002',
    name: 'Minh Tuấn',
    genre: 'Pop',
    link: 'https://soundcloud.com/minhtuan',
    submittedAt: '2026-03-20',
    status: 'pending',
  },
  {
    id: 'AR002',
    userId: 'USER_003',
    name: 'Lan Phương',
    genre: 'R&B',
    link: 'https://spotify.com/lanphuong',
    submittedAt: '2026-03-21',
    status: 'pending',
  },
];

const mockReports = [
  {
    id: 'RPT001',
    songId: 'S1',
    songTitle: 'Chạy Ngay Đi',
    reporter: 'user@test.com',
    reason: 'Vi phạm bản quyền',
    description: '',
    submittedAt: '2026-03-22',
    status: 'pending',
  },
  {
    id: 'RPT002',
    songId: 'S2',
    songTitle: 'Waiting For You',
    reporter: 'user@test.com',
    reason: 'Spam',
    description: 'Bài hát này xuất hiện quá nhiều lần',
    submittedAt: '2026-03-22',
    status: 'pending',
  },
];

// ==========================================
// API FUNCTIONS
// ==========================================

export const getStats = async () => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockStats), 300));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/stats`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải thống kê');
    return await response.json();
  } catch (error) {
    return mockStats;
  }
};

export const getArtistRequests = async () => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockArtistRequests), 400));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/artist-requests`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải danh sách yêu cầu nghệ sĩ');
    return await response.json();
  } catch (error) {
    return mockArtistRequests;
  }
};

export const approveArtistTick = async (userId) => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 600));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/artist-requests/${userId}/approve`, { method: 'POST', headers });
    if (!response.ok) throw new Error('Lỗi khi duyệt yêu cầu');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const rejectArtistTick = async (userId) => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 600));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/artist-requests/${userId}/reject`, { method: 'POST', headers });
    if (!response.ok) throw new Error('Lỗi khi từ chối yêu cầu');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getReports = async () => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockReports), 400));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/reports`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải danh sách báo cáo');
    return await response.json();
  } catch (error) {
    return mockReports;
  }
};

export const resolveReport = async (reportId) => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 400));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/reports/${reportId}/resolve`, { method: 'POST', headers });
    if (!response.ok) throw new Error('Lỗi khi giải quyết báo cáo');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const removeSong = async (songId) => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 400));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/songs/${songId}`, { method: 'DELETE', headers });
    if (!response.ok) throw new Error('Lỗi khi gỡ bài hát');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};
