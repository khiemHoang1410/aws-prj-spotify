import api from './apiClient';

export const getStats = async () => {
  return api.get('/admin/stats');
};

export const getArtistRequests = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.status) queryParams.append('status', params.status);
    const query = queryParams.toString();
    return await api.get(`/admin/artist-requests${query ? `?${query}` : ''}`);
  } catch {
    return { items: [], nextCursor: null };
  }
};

export const approveArtistTick = (requestId) =>
  api.post(`/admin/artist-requests/${requestId}/approve`).catch(() => ({ success: false }));

export const rejectArtistTick = (requestId, adminNote = '') =>
  api.post(`/admin/artist-requests/${requestId}/reject`, { adminNote }).catch(() => ({ success: false }));

export const getReports = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.status) queryParams.append('status', params.status);
    const query = queryParams.toString();
    return await api.get(`/admin/reports${query ? `?${query}` : ''}`);
  } catch {
    return { items: [], nextCursor: null };
  }
};

export const resolveReport = (reportId) =>
  api.post(`/admin/reports/${reportId}/resolve`).catch(() => ({ success: false }));

// Resolve report + xóa bài hát cùng lúc (atomic)
export const resolveAndRemoveSong = (reportId) =>
  api.post(`/admin/reports/${reportId}/resolve-and-remove`).catch(() => ({ success: false }));

export const removeSong = (songId) =>
  api.delete(`/admin/songs/${songId}`).catch(() => ({ success: false }));

// User Management
export const getUsers = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return await api.get(`/admin/users${query ? `?${query}` : ''}`);
  } catch {
    return { items: [], nextCursor: null };
  }
};

export const getUser = (userId) =>
  api.get(`/admin/users/${userId}`).catch(() => null);

export const banUser = (userId) =>
  api.post(`/admin/users/${userId}/ban`).catch(() => ({ success: false }));

export const unbanUser = (userId) =>
  api.post(`/admin/users/${userId}/unban`).catch(() => ({ success: false }));

export const changeUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role }).catch(() => ({ success: false }));

// Content Management — Songs
export const getSongs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    return await api.get(`/admin/songs${query ? `?${query}` : ''}`);
  } catch {
    return { items: [], nextCursor: null };
  }
};

export const bulkDeleteSongs = (ids) =>
  api.post('/admin/songs/bulk-delete', { ids }).catch(() => ({ succeeded: 0, failed: ids.length }));

// Content Management — Albums
export const getAlbums = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    return await api.get(`/admin/albums${query ? `?${query}` : ''}`);
  } catch {
    return { items: [], nextCursor: null };
  }
};

export const deleteAlbum = (albumId) =>
  api.delete(`/admin/albums/${albumId}`).catch(() => ({ success: false }));

// Content Management — Artists
export const getArtists = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    return await api.get(`/admin/artists${query ? `?${query}` : ''}`);
  } catch {
    return { items: [], nextCursor: null };
  }
};

export const verifyArtist = (artistId, isVerified) =>
  api.patch(`/admin/artists/${artistId}/verify`, { isVerified }).catch(() => ({ success: false }));

// Bulk resolve reports
export const bulkResolveReports = (ids) =>
  api.post('/admin/reports/bulk-resolve', { ids }).catch(() => ({ succeeded: 0, failed: ids.length }));

// Editorial Playlists
export const getEditorialPlaylists = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    const query = queryParams.toString();
    return await api.get(`/admin/editorial-playlists${query ? `?${query}` : ''}`);
  } catch {
    return { items: [], nextCursor: null };
  }
};

export const getEditorialPlaylist = (id) =>
  api.get(`/admin/editorial-playlists/${id}`).catch(() => null);

export const createEditorialPlaylist = (data) =>
  api.post('/admin/editorial-playlists', data);

export const updateEditorialPlaylist = (id, data) =>
  api.patch(`/admin/editorial-playlists/${id}`, data);

export const deleteEditorialPlaylist = (id) =>
  api.delete(`/admin/editorial-playlists/${id}`).catch(() => ({ success: false }));

export const publishEditorialPlaylist = (id) =>
  api.post(`/admin/editorial-playlists/${id}/publish`).catch(() => ({ success: false }));

export const unpublishEditorialPlaylist = (id) =>
  api.post(`/admin/editorial-playlists/${id}/unpublish`).catch(() => ({ success: false }));

export const addSongToEditorialPlaylist = (playlistId, songId) =>
  api.post(`/admin/editorial-playlists/${playlistId}/songs`, { songId });

export const removeSongFromEditorialPlaylist = (playlistId, songId) =>
  api.delete(`/admin/editorial-playlists/${playlistId}/songs/${songId}`).catch(() => ({ success: false }));
