import api from './apiClient';
import { adaptAlbum, adaptPaginatedResponse } from './adapters';

export const getAllAlbums = async () => {
  const data = await api.get('/albums');
  return adaptPaginatedResponse(data, adaptAlbum);
};

export const getAlbumById = async (albumId) => {
  const data = await api.get(`/albums/${encodeURIComponent(albumId)}`);
  return adaptAlbum(data);
};

export const getAlbumsByArtist = async (artistName) => {
  const data = await api.get(`/albums?artist=${encodeURIComponent(artistName)}`);
  return adaptPaginatedResponse(data, adaptAlbum);
};

export const createAlbum = async (payload) => {
  return api.post('/albums', payload);
};

export const updateAlbum = async (albumId, payload) => {
  return api.put(`/albums/${encodeURIComponent(albumId)}`, payload);
};

export const deleteAlbum = async (albumId) => {
  return api.delete(`/albums/${encodeURIComponent(albumId)}`);
};

export const addSongToAlbum = async (albumId, songId) => {
  return api.post(`/albums/${encodeURIComponent(albumId)}/songs`, { song_id: songId });
};

export const removeSongFromAlbum = async (albumId, songId) => {
  return api.delete(`/albums/${encodeURIComponent(albumId)}/songs/${encodeURIComponent(songId)}`);
};
