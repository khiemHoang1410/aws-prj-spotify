import api from './apiClient';
import { adaptSong, adaptPaginatedResponse } from './adapters';

export const getSongs = async () => {
  try {
    const data = await api.get('/songs');
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
    const data = await api.get(`/songs?category=${encodeURIComponent(categoryId)}`);
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
  return api.put(`/songs/${encodeURIComponent(songId)}`, payload);
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

/** Client-side relevance search — deprecated, dùng searchSongs() */
export const searchWithRelevance = () => ({ songs: [], matchedCategories: [] });
