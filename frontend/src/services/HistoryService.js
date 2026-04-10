/**
 * HistoryService — thin wrapper over apiClient cho play history.
 * Logic localStorage và debounce nằm trong historySlice + store.js.
 */
import api from './apiClient';

export const recordPlay = async (song) => {
  if (!import.meta.env.VITE_API_URL) return null;
  return api.post('/me/play-history', {
    songId: song.song_id || song.songId,
    songTitle: song.title || song.songTitle,
    artistId: song.artist_id || song.artistId || null,
    artistName: song.artist_name || song.artistName || null,
    coverUrl: song.image_url || song.coverUrl || null,
    duration: song.duration || null,
  });
};

export const getPlayHistory = async (userId, { limit = 20, cursor } = {}) => {
  if (!import.meta.env.VITE_API_URL) return { items: [], nextCursor: null };
  const params = new URLSearchParams({ limit });
  if (cursor) params.set('cursor', cursor);
  return api.get(`/users/${userId}/play-history?${params}`);
};

export const deleteHistoryEntry = async (entryId) => {
  if (!import.meta.env.VITE_API_URL) return null;
  return api.delete(`/me/play-history/${encodeURIComponent(entryId)}`);
};

export const clearPlayHistory = async () => {
  if (!import.meta.env.VITE_API_URL) return null;
  return api.delete('/me/play-history');
};
