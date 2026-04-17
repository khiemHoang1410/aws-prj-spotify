import api from './apiClient';
import { adaptAlbum, adaptSong, adaptPaginatedResponse } from './adapters';

export const getAllAlbums = async () => {
  try {
    const data = await api.get('/albums');
    return adaptPaginatedResponse(data, adaptAlbum);
  } catch {
    return [];
  }
};

export const getAlbumById = async (albumId) => {
  try {
    const data = await api.get(`/albums/${encodeURIComponent(albumId)}`);
    return adaptAlbum(data);
  } catch {
    return null;
  }
};

export const getAlbumsByArtist = async (artistName) => {
  try {
    const data = await api.get(`/albums?artist=${encodeURIComponent(artistName)}`);
    return adaptPaginatedResponse(data, adaptAlbum);
  } catch {
    return [];
  }
};

export const createAlbum = async (payload) => {
  try {
    const rawData = await api.post('/albums', payload);
    return { success: true, data: adaptAlbum(rawData) };
  } catch {
    return { success: false, data: null };
  }
};

export const updateAlbum = async (albumId, payload) => {
  try {
    return await api.put(`/albums/${encodeURIComponent(albumId)}`, payload);
  } catch {
    return { success: false };
  }
};

export const deleteAlbum = async (albumId) => {
  try {
    return await api.delete(`/albums/${encodeURIComponent(albumId)}`);
  } catch {
    return { success: false };
  }
};

export const getAlbumSongs = async (albumId) => {
  try {
    const data = await api.get(`/albums/${encodeURIComponent(albumId)}/songs`);
    const list = Array.isArray(data) ? data : (data?.items || []);
    // Dùng adaptSong để đảm bảo đủ fields kể cả mv_url
    return list.map(adaptSong);
  } catch {
    return [];
  }
};

export const addSongToAlbum = async (albumId, songId) => {
  try {
    await api.post(`/albums/${encodeURIComponent(albumId)}/songs`, { song_id: songId });
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const removeSongFromAlbum = async (albumId, songId) => {
  try {
    await api.delete(`/albums/${encodeURIComponent(albumId)}/songs/${encodeURIComponent(songId)}`);
    return { success: true };
  } catch {
    return { success: false };
  }
};
