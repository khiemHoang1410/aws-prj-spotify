import api from './apiClient';
import { adaptPlaylist, adaptSong, adaptPaginatedResponse } from './adapters';
import { getCurrentUser } from './AuthService';

const LIKED_PLAYLIST_KEY = 'spotify_liked_playlist_id';
const LIKED_PLAYLIST_NAME = 'Bài hát đã yêu thích';
let likedPlaylistPromise = null;

// ─── Helpers ────────────────────────────────────────────────────────────────────

const normalizePlaylistName = (name = '') =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

export const isLikedPlaylistName = (name = '') => {
  const normalized = normalizePlaylistName(name);
  return (
    normalized === 'bai hat da yeu thich' ||
    normalized === 'bai hat da thich' ||
    normalized === 'yeu thich' ||
    normalized === 'liked songs'
  );
};

const getLikedPlaylistCacheKey = async () => {
  try {
    const user = await getCurrentUser();
    if (user?.user_id) return `${LIKED_PLAYLIST_KEY}_${user.user_id}`;
  } catch { /* ignore */ }
  return LIKED_PLAYLIST_KEY;
};

const clearLikedPlaylistCache = async () => {
  const cacheKey = await getLikedPlaylistCacheKey();
  localStorage.removeItem(cacheKey);
  likedPlaylistPromise = null;
};

// ─── CRUD Playlists ─────────────────────────────────────────────────────────────

export const getPlaylists = async () => {
  try {
    const data = await api.get('/playlists');
    return adaptPaginatedResponse(data, adaptPlaylist);
  } catch {
    return [];
  }
};

export const getMyPlaylists = async () => {
  try {
    const data = await api.get('/playlists/me');
    const raw = Array.isArray(data) ? data : data?.items || [];
    // Chỉ giữ items có entityType=PLAYLIST (BE có thể trả lẫn ARTIST/ARTIST_REQUEST)
    const playlistsOnly = raw.filter((item) => item.entityType === 'PLAYLIST');
    return playlistsOnly.map(adaptPlaylist);
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
    const result = await api.delete(`/playlists/${id}`);
    // Nếu xoá trúng liked playlist → clear cache
    const cacheKey = await getLikedPlaylistCacheKey();
    if (localStorage.getItem(cacheKey) === id) {
      localStorage.removeItem(cacheKey);
      likedPlaylistPromise = null;
    }
    return result;
  } catch {
    return { success: false };
  }
};

// ─── Playlist Songs ─────────────────────────────────────────────────────────────

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

// ─── Liked Playlist (unique per user) ───────────────────────────────────────────

const fetchOrCreateLikedPlaylist = async () => {
  const cacheKey = await getLikedPlaylistCacheKey();

  try {
    const data = await api.get('/playlists/me');
    const playlists = adaptPaginatedResponse(data, adaptPlaylist);
    const likedPlaylists = playlists.filter((p) => isLikedPlaylistName(p.name));

    if (likedPlaylists.length > 0) {
      const keeper = likedPlaylists[0];
      // Dọn bản sao trùng — giữ duy nhất 1 playlist "Yêu thích" per user
      await Promise.all(
        likedPlaylists.slice(1).map((pl) =>
          api.delete(`/playlists/${encodeURIComponent(pl.id)}`).catch(() => null)
        )
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
};

export const getLikedPlaylistId = async (forceRefresh = false) => {
  if (!forceRefresh && likedPlaylistPromise) return likedPlaylistPromise;

  likedPlaylistPromise = (async () => {
    if (!forceRefresh) {
      const cacheKey = await getLikedPlaylistCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (cached) return cached;
    }
    return fetchOrCreateLikedPlaylist();
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

// ─── Like / Unlike Song (with stale cache retry) ────────────────────────────────

export const likeSong = async (song) => {
  if (!song?.song_id) return { success: false, error: 'Invalid song data' };

  const tryLike = async (playlistId) => {
    const response = await api.post(`/playlists/${playlistId}/songs`, { song_id: song.song_id });
    if (response?.success === false) {
      return { success: false, error: response?.message || 'Failed to like song' };
    }
    return { success: true };
  };

  try {
    const playlistId = await getLikedPlaylistId();
    if (!playlistId) return { success: false, error: 'No liked playlist found' };

    const result = await tryLike(playlistId);

    // Retry: nếu playlist bị xoá (stale cache) → clear cache + tạo lại + thử lại
    if (!result.success && result.error?.includes('không tồn tại')) {
      await clearLikedPlaylistCache();
      const newPlaylistId = await getLikedPlaylistId(true);
      if (!newPlaylistId) return { success: false, error: 'Cannot create liked playlist' };
      return tryLike(newPlaylistId);
    }

    return result;
  } catch (error) {
    // Retry on 404 thrown as exception
    if (error?.status === 404 || error?.message?.includes('không tồn tại')) {
      try {
        await clearLikedPlaylistCache();
        const newPlaylistId = await getLikedPlaylistId(true);
        if (!newPlaylistId) return { success: false, error: 'Cannot create liked playlist' };
        return await tryLike(newPlaylistId);
      } catch (retryErr) {
        return { success: false, error: retryErr?.message || 'Retry failed' };
      }
    }
    return { success: false, error: error?.message || 'Failed to like song' };
  }
};

export const unlikeSong = async (songId) => {
  if (!songId || typeof songId !== 'string' || songId.trim() === '') {
    return { success: false, error: 'Invalid song ID format' };
  }

  const tryUnlike = async (playlistId) => {
    const response = await api.delete(
      `/playlists/${playlistId}/songs/${encodeURIComponent(songId)}`
    );
    if (response?.success === false) {
      return { success: false, error: response?.message || 'Failed to unlike song' };
    }
    return { success: true };
  };

  try {
    const playlistId = await getLikedPlaylistId();
    if (!playlistId) return { success: false, error: 'No liked playlist found' };

    const result = await tryUnlike(playlistId);

    if (!result.success && result.error?.includes('không tồn tại')) {
      await clearLikedPlaylistCache();
      const newPlaylistId = await getLikedPlaylistId(true);
      if (!newPlaylistId) return { success: false, error: 'Cannot create liked playlist' };
      return tryUnlike(newPlaylistId);
    }

    return result;
  } catch (error) {
    if (error?.status === 404 || error?.message?.includes('không tồn tại')) {
      try {
        await clearLikedPlaylistCache();
        const newPlaylistId = await getLikedPlaylistId(true);
        if (!newPlaylistId) return { success: false, error: 'Cannot create liked playlist' };
        return await tryUnlike(newPlaylistId);
      } catch (retryErr) {
        return { success: false, error: retryErr?.message || 'Retry failed' };
      }
    }
    return { success: false, error: error?.message || 'Failed to unlike song' };
  }
};
