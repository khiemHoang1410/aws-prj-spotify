import api from './apiClient';
import { adaptSong, adaptPlaylist, adaptPaginatedResponse } from './adapters';
import { getCurrentUser } from './AuthService';

export const getSongs = async () => {
  try {
    const data = await api.get('/songs');
    return adaptPaginatedResponse(data, adaptSong);
  } catch {
    return [];
  }
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

// Playlists
export const getPlaylists = async () => {
  try {
    const data = await api.get('/playlists');
    return adaptPaginatedResponse(data, adaptPlaylist);
  } catch {
    return [];
  }
};

export const getPlaylistById = async (id) => {
  try {
    const data = await api.get(`/playlists/${id}`);
    return adaptPlaylist(data);
  } catch {
    return null;
  }
};

export const createPlaylist = async (payload) => {
  try {
    const data = await api.post('/playlists', payload);
    return { success: true, data: adaptPlaylist(data) };
  } catch {
    return { success: false, data: null };
  }
};

export const deletePlaylist = async (id) => {
  try {
    return await api.delete(`/playlists/${id}`);
  } catch {
    return { success: false };
  }
};

export const addSongToPlaylist = async (playlistId, song) => {
  try {
    return await api.post(`/playlists/${playlistId}/songs`, { song_id: song.song_id });
  } catch {
    return { success: false };
  }
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  try {
    return await api.delete(`/playlists/${playlistId}/songs/${songId}`);
  } catch {
    return { success: false };
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

// ─── Liked Songs via playlist "Yêu thích" ─────────────────────────────────────
const LIKED_PLAYLIST_KEY = 'spotify_liked_playlist_id';
const LIKED_PLAYLIST_NAME = 'Bài hát đã yêu thích';
let likedPlaylistPromise = null;

const normalizePlaylistName = (name = '') => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

export const isLikedPlaylistName = (name = '') => {
  const normalized = normalizePlaylistName(name);
  return normalized === 'bai hat da yeu thich'
    || normalized === 'bai hat da thich'
    || normalized === 'yeu thich'
    || normalized === 'liked songs';
};

const getLikedPlaylistCacheKey = async () => {
  try {
    const user = await getCurrentUser();
    if (user?.user_id) return `${LIKED_PLAYLIST_KEY}_${user.user_id}`;
  } catch { /* ignore */ }
  return LIKED_PLAYLIST_KEY;
};

export const getLikedPlaylistId = async () => {
  if (likedPlaylistPromise) return likedPlaylistPromise;

  likedPlaylistPromise = (async () => {
    const cacheKey = await getLikedPlaylistCacheKey();
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
      const data = await api.get('/playlists/me');
      const playlists = adaptPaginatedResponse(data, adaptPlaylist);
      const likedPlaylists = playlists.filter((p) => isLikedPlaylistName(p.name));
      if (likedPlaylists.length > 0) {
        const keeper = likedPlaylists[0];
        // Dọn bản sao trùng để chỉ còn 1 playlist "Yêu thích"
        await Promise.all(
          likedPlaylists.slice(1).map((pl) => api.delete(`/playlists/${encodeURIComponent(pl.id)}`).catch(() => null))
        );
        localStorage.setItem(cacheKey, keeper.id);
        return keeper.id;
      }
    } catch { /* ignore */ }

    // Tạo mới nếu chưa có
    try {
      const created = await api.post('/playlists', { name: LIKED_PLAYLIST_NAME });
      const createdPlaylist = adaptPlaylist(created);
      if (createdPlaylist?.id) {
        localStorage.setItem(cacheKey, createdPlaylist.id);
        return createdPlaylist.id;
      }
    } catch { /* ignore */ }

    return null;
  })();

  try {
    return await likedPlaylistPromise;
  } finally {
    likedPlaylistPromise = null;
  }
};

export const getLikedSongs = async () => {
  try {
    const playlistId = await getLikedPlaylistId();
    if (!playlistId) return [];
    const data = await api.get(`/playlists/${playlistId}/songs`);
    return adaptPaginatedResponse(data, adaptSong);
  } catch {
    return [];
  }
};

export const likeSong = async (song) => {
  try {
    const playlistId = await getLikedPlaylistId();
    if (!playlistId) return { success: false };
    await api.post(`/playlists/${playlistId}/songs`, { song_id: song.song_id });
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const unlikeSong = async (songId) => {
  try {
    const playlistId = await getLikedPlaylistId();
    if (!playlistId) return { success: false };
    await api.delete(`/playlists/${playlistId}/songs/${encodeURIComponent(songId)}`);
    return { success: true };
  } catch {
    return { success: false };
  }
};
