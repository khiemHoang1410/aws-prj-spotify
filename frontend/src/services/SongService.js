import api from './apiClient';
import { adaptSong, adaptPlaylist, adaptPaginatedResponse } from './adapters';

export const getSongs = async () => {
  const data = await api.get('/songs');
  return adaptPaginatedResponse(data, adaptSong);
};

export const getSongById = async (songId) => {
  const data = await api.get(`/songs/${encodeURIComponent(songId)}`);
  return adaptSong(data);
};

export const getTopSongs = () => getSongs();

export const getSongsByCategory = async (categoryId) => {
  const data = await api.get(`/songs?category=${encodeURIComponent(categoryId)}`);
  return adaptPaginatedResponse(data, adaptSong);
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
  const data = await api.get(`/search?q=${encodeURIComponent(query)}`);
  return (data?.songs || []).map(adaptSong);
};

// Playlists
export const getPlaylists = async () => {
  const data = await api.get('/playlists');
  return adaptPaginatedResponse(data, adaptPlaylist);
};

export const getPlaylistById = async (id) => {
  const data = await api.get(`/playlists/${id}`);
  return adaptPlaylist(data);
};

export const createPlaylist = async (payload) => {
  return api.post('/playlists', payload);
};

export const deletePlaylist = async (id) => {
  return api.delete(`/playlists/${id}`);
};

export const addSongToPlaylist = async (playlistId, song) => {
  return api.post(`/playlists/${playlistId}/songs`, { song_id: song.song_id });
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  return api.delete(`/playlists/${playlistId}/songs/${songId}`);
};

export const getLyrics = async (songId) => {
  const data = await api.get(`/songs/${encodeURIComponent(songId)}/lyrics`);
  return data?.lyrics ?? [];
};

/** Client-side relevance search — deprecated, dùng searchSongs() */
export const searchWithRelevance = () => ({ songs: [], matchedCategories: [] });
