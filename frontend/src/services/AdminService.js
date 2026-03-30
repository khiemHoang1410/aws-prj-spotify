import api from './apiClient';

export const getStats = () => api.get('/admin/stats');

export const getArtistRequests = () => api.get('/admin/artist-requests');

export const approveArtistTick = (requestId) =>
  api.post(`/admin/artist-requests/${requestId}/approve`);

export const rejectArtistTick = (requestId, adminNote = '') =>
  api.post(`/admin/artist-requests/${requestId}/reject`, { adminNote });

export const getReports = () => api.get('/admin/reports');

export const resolveReport = (reportId) =>
  api.post(`/admin/reports/${reportId}/resolve`);

export const removeSong = (songId) =>
  api.delete(`/admin/songs/${songId}`);
