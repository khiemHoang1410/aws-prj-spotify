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
    const data = await api.get(`/artists/${artistId}`);
    return adaptArtist(data);
  } catch {
    return null;
  }
};

export const getArtistInfo = async (artistName) => {
  try {
    const data = await api.get(`/artists?name=${encodeURIComponent(artistName)}`);
    return adaptPaginatedResponse(data, adaptArtist)[0] ?? null;
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
    return await api.get(`/artists/${artistId}/stats`);
  } catch {
    return { totalSongs: 0, totalAlbums: 0, totalPlays: 0 };
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
    const data = await api.get('/artists/followed');
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
