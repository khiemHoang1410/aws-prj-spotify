import { getAuthHeaders } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL;

export const getStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/stats`, { headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { totalSongs: 0, verifiedArtists: 0, pendingReports: 0, totalUsers: 0 };
  }
};

export const getArtistRequests = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/artist-requests`, { headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
};

// id ở đây là requestId (id của ArtistRequest), không phải userId
export const approveArtistTick = async (requestId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/artist-requests/${requestId}/approve`, {
      method: 'POST', headers,
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const rejectArtistTick = async (requestId, adminNote = '') => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/artist-requests/${requestId}/reject`, {
      method: 'POST', headers, body: JSON.stringify({ adminNote }),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const getReports = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/reports`, { headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
};

export const resolveReport = async (reportId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/reports/${reportId}/resolve`, {
      method: 'POST', headers,
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const removeSong = async (songId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/admin/songs/${songId}`, {
      method: 'DELETE', headers,
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};
