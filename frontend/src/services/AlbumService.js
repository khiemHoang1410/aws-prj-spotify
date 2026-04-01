import api from './apiClient';
import { adaptAlbum, adaptPaginatedResponse } from './adapters';

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
    const albums = await getAllAlbums();
    const keyword = String(artistName || '').trim().toLowerCase();
    return (Array.isArray(albums) ? albums : []).filter((album) => {
      if (!album?.id || !album?.title) return false;
      if (!keyword) return true;
      return String(album.artist_name || '').trim().toLowerCase() === keyword;
    });
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
