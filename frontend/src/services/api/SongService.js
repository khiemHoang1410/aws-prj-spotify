import { getAuthHeaders } from "./AuthService";
import { adaptSong, adaptPlaylist, adaptPaginatedResponse } from "./adapters";

const API_URL = import.meta.env.VITE_API_URL;

export const getSongs = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/songs`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return adaptPaginatedResponse(data, adaptSong);
  } catch {
    return [];
  }
};

export const getLyrics = async (_songId) => [];

export const getPlaylists = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/playlists`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return adaptPaginatedResponse(data, adaptPlaylist);
  } catch {
    return [];
  }
};

export const getCategories = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/categories`, { headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
};

export const getPlaylistById = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/playlists/${id}`, { headers });
    if (!res.ok) throw new Error();
    return adaptPlaylist(await res.json());
  } catch {
    return null;
  }
};

export const createPlaylist = async (data) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/playlists`, {
      method: "POST", headers, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const deletePlaylist = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/playlists/${id}`, { method: "DELETE", headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const addSongToPlaylist = async (playlistId, song) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/playlists/${playlistId}/songs`, {
      method: "POST", headers, body: JSON.stringify({ song_id: song.song_id }),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/playlists/${playlistId}/songs/${songId}`, {
      method: "DELETE", headers,
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const updateSong = async (songId, data) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}`, {
      method: "PUT", headers, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const deleteSong = async (songId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}`, {
      method: "DELETE", headers,
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const reportSong = async (songId, reason, description = "") => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/songs/${songId}/report`, {
      method: "POST", headers, body: JSON.stringify({ reason, description }),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const getTopSongs = async () => getSongs();

export const searchSongs = async (query) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return (data.songs || []).map(adaptSong);
  } catch {
    return [];
  }
};

export const getSongsByCategory = async (categoryId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/songs?category=${encodeURIComponent(categoryId)}`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return adaptPaginatedResponse(data, adaptSong);
  } catch {
    return [];
  }
};

export const searchWithRelevance = (query) => {
  // Client-side search removed — use searchSongs() for API search
  return { songs: [], matchedCategories: [] };
};
