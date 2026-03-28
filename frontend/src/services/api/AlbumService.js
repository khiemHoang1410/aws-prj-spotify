import { getAuthHeaders } from './AuthService';
import { adaptAlbum, adaptPaginatedResponse } from './adapters';

const API_URL = import.meta.env.VITE_API_URL;

export const getAlbumsByArtist = async (artistName) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/albums?artist=${encodeURIComponent(artistName)}`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return adaptPaginatedResponse(data, adaptAlbum);
  } catch {
    return [];
  }
};

export const getAlbumById = async (albumId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}`, { headers });
    if (!res.ok) throw new Error();
    return adaptAlbum(await res.json());
  } catch {
    return null;
  }
};

export const getAllAlbums = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/albums`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return adaptPaginatedResponse(data, adaptAlbum);
  } catch {
    return [];
  }
};

export const createAlbum = async (data) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/albums`, {
      method: 'POST', headers, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const updateAlbum = async (albumId, data) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}`, {
      method: 'PUT', headers, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const deleteAlbum = async (albumId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}`, {
      method: 'DELETE', headers,
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const addSongToAlbum = async (albumId, songId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}/songs`, {
      method: 'POST', headers, body: JSON.stringify({ song_id: songId }),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const removeSongFromAlbum = async (albumId, songId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}/songs/${encodeURIComponent(songId)}`, {
      method: 'DELETE', headers,
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};
