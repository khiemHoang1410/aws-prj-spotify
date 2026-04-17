import api from './apiClient';
import { adaptArtist, adaptPaginatedResponse } from './adapters';

export const getArtists = async () => {
  try {
    const data = await api.get('/artists');
    return adaptPaginatedResponse(data, adaptArtist);
  } catch {
    return [];
  }
};

export const getArtistById = async (artistId) => {
  try {
    // silent: true — hàm đã return null khi lỗi, không cần toast 404
    const data = await api.get(`/artists/${artistId}`, { silent: true });
    return adaptArtist(data);
  } catch {
    return null;
  }
};

export const getArtistInfo = async (artistName) => {
  try {
    const data = await api.get(`/artists?name=${encodeURIComponent(artistName)}`);
    const fromSearch = adaptPaginatedResponse(data, adaptArtist);
    const candidate = Array.isArray(fromSearch) ? fromSearch[0] : null;
    if (candidate?.id) return candidate;

    const allArtists = await getArtists();
    const keyword = String(artistName || '').trim().toLowerCase();
    return (Array.isArray(allArtists) ? allArtists : []).find(
      (artist) => String(artist?.name || '').trim().toLowerCase() === keyword
    ) || null;
  } catch {
    return null;
  }
};

export const getArtistByUserId = async (userId) => {
  try {
    const data = await api.get(`/artists?userId=${encodeURIComponent(userId)}`);
    if (Array.isArray(data)) return data[0] ? adaptArtist(data[0]) : null;
    if (data?.items) return data.items[0] ? adaptArtist(data.items[0]) : null;
    return data ? adaptArtist(data) : null;
  } catch {
    return null;
  }
};

export const getArtistStats = async (artistId) => {
  try {
    const data = await getArtistById(artistId);
    return {
      totalSongs: 0,
      totalAlbums: 0,
      totalPlays: 0,
      followers: data?.followers || 0,
      monthlyListeners: Number(data?.monthly_listeners) || 0,
    };
  } catch {
    return { totalSongs: 0, totalAlbums: 0, totalPlays: 0, followers: 0, monthlyListeners: 0 };
  }
};

export const followArtist = async (artistId) => {
  try {
    return await api.post(`/artists/${artistId}/follow`);
  } catch {
    return { success: false };
  }
};

export const getFollowedArtists = async () => {
  try {
    const data = await api.get('/artists/followed', { silent: true });
    return adaptPaginatedResponse(data, adaptArtist);
  } catch {
    return [];
  }
};

export const searchArtists = async (query) => {
  try {
    const data = await api.get(`/search?q=${encodeURIComponent(query)}&type=artist`);
    return (data?.artists || []).map(adaptArtist);
  } catch {
    return [];
  }
};

export const getRelatedArtists = async (artistId) => {
  try {
    const data = await api.get(`/artists/${artistId}/related`);
    const arr = Array.isArray(data) ? data : (data?.items || data?.data || []);
    return arr.map(adaptArtist).filter(Boolean);
  } catch {
    return [];
  }
};
