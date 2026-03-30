import api from './apiClient';

export const getStats = async () => {
  try {
    return await api.get('/admin/stats');
  } catch {
    return { users: 0, songs: 0, artists: 0, reports: 0 };
  }
};

export const getArtistRequests = async () => {
  try {
    const data = await api.get('/admin/artist-requests');
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch {
    return [];
  }
};

export const approveArtistTick = (requestId) =>
  api.post(`/admin/artist-requests/${requestId}/approve`).catch(() => ({ success: false }));

export const rejectArtistTick = (requestId, adminNote = '') =>
  api.post(`/admin/artist-requests/${requestId}/reject`, { adminNote }).catch(() => ({ success: false }));

export const getReports = async () => {
  try {
    const data = await api.get('/admin/reports');
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch {
    return [];
  }
};

export const resolveReport = (reportId) =>
  api.post(`/admin/reports/${reportId}/resolve`).catch(() => ({ success: false }));

export const removeSong = (songId) =>
  api.delete(`/admin/songs/${songId}`).catch(() => ({ success: false }));
