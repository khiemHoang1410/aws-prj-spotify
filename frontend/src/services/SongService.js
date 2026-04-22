import api from './apiClient';
import { adaptSong, adaptPaginatedResponse } from './adapters';

export const getSongs = async () => {
  try {
    // silent: true — danh sách bài hát không cần toast khi cold start Lambda
    const data = await api.get('/songs', { silent: true });
    return adaptPaginatedResponse(data, adaptSong);
  } catch {
    return [];
  }
};

export const getSongById = async (songId) => {
  const data = await api.get(`/songs/${encodeURIComponent(songId)}`);
  return adaptSong(data);
};

export const getTopSongs = () => getSongs();

export const getSongsByCategory = async (categoryId) => {
  try {
    const data = await api.get(`/songs?genre=${encodeURIComponent(categoryId)}`);
    return adaptPaginatedResponse(data, adaptSong);
  } catch {
    return [];
  }
};

export const getSongsByArtist = async (artistId) => {
  try {
    const allSongs = await getSongs();
    // Filter: artist_id matches AND not part of album (albumId is null or undefined)
    return allSongs.filter((song) =>
      song.artist_id === artistId &&
      (!song.albumId || song.albumId === null)
    );
  } catch {
    return [];
  }
};

export const updateSong = async (songId, payload) => {
  try {
    const data = await api.put(`/songs/${encodeURIComponent(songId)}`, payload);
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err?.message || 'Lỗi khi cập nhật bài hát' };
  }
};

export const deleteSong = async (songId) => {
  return api.delete(`/songs/${encodeURIComponent(songId)}`);
};

export const reportSong = async (songId, reason, description = '') => {
  return api.post(`/songs/${songId}/report`, { reason, description });
};

export const searchSongs = async (query) => {
  try {
    const data = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return (data?.songs || []).map(adaptSong);
  } catch {
    return [];
  }
};



export const getLyrics = async (songId) => {
  try {
    const data = await api.get(`/songs/${encodeURIComponent(songId)}/lyrics`);
    return data?.lyrics ?? [];
  } catch {
    return [];
  }
};

export const recordView = async (songId) => {
  if (!songId) return;
  try {
    // silent: true — lỗi 503/5xx không hiện toast vì đây là fire-and-forget
    await api.post(`/songs/${encodeURIComponent(songId)}/view`, undefined, { silent: true });
  } catch {
    // Fire-and-forget: lỗi không được ảnh hưởng playback
  }
};

export const likeSong = async (songId) => {
  try {
    await api.post(`/songs/${encodeURIComponent(songId)}/like`);
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const unlikeSong = async (songId) => {
  try {
    await api.delete(`/songs/${encodeURIComponent(songId)}/like`);
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const getLikedSongs = async () => {
  try {
    const data = await api.get('/me/liked-songs?limit=100', { silent: true });
    return (data?.items || []).map(adaptSong);
  } catch {
    return [];
  }
};

export const getTrendingSongs = async (limit = 20) => {
  try {
    const data = await api.get(`/songs/trending?limit=${Math.min(limit, 50)}`);
    return Array.isArray(data) ? data.map(adaptSong) : (data?.items || []).map(adaptSong);
  } catch {
    return [];
  }
};

/** Client-side relevance search — deprecated, dùng searchSongs() */
export const searchWithRelevance = () => ({ songs: [], matchedCategories: [] });
