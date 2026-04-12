import api from './apiClient';
import { adaptSong, adaptPaginatedResponse } from './adapters';
import { getCurrentUser } from './AuthService';

const LIKED_PLAYLIST_KEY = 'spotify_liked_playlist_id';
const LIKED_PLAYLIST_NAME = 'Bài hát đã yêu thích';
let likedPlaylistPromise = null;
let likedPlaylistCreatePromise = null;

const normalizePlaylistName = (name = '') =>
  String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const parseDateTs = (value) => {
  const ts = Date.parse(value || '');
  return Number.isFinite(ts) ? ts : 0;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchLikedCandidatesFromServer = async (retries = 2, retryDelayMs = 250) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const normalized = normalizePlaylistCollection(await api.get('/playlists/me'));
      const liked = normalized.filter((playlist) => isLikedPlaylistName(playlist.name));
      return { ok: true, liked };
    } catch {
      if (attempt < retries) await wait(retryDelayMs);
    }
  }
  return { ok: false, liked: [] };
};

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizePlaylist = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.id || raw.playlistId || raw.playlist_id;
  const name = raw.name || raw.title || '';
  const userId = raw.userId || raw.user_id || raw.ownerId || null;

  if (!id || !name) return null;

  const songs = Array.isArray(raw.songs) ? raw.songs.map(adaptSong).filter(Boolean) : [];

  return {
    id,
    name,
    owner: raw.ownerName || raw.owner || 'Bạn',
    userId,
    image_url: raw.coverUrl || raw.image_url || null,
    songs,
    created_at: raw.createdAt || raw.created_at || null,
    updated_at: raw.updatedAt || raw.updated_at || null,
    is_public: raw.isPublic ?? raw.is_public ?? false,
    entityType: raw.entityType || null,
  };
};

const dedupePlaylists = (playlists) => {
  const byKey = new Map();

  playlists.forEach((playlist) => {
    const normalizedName = normalizePlaylistName(playlist.name);
    const key = `${normalizedName}__${playlist.userId || 'anon'}`;
    const current = byKey.get(key);

    if (!current) {
      byKey.set(key, playlist);
      return;
    }

    const nextTs = parseDateTs(playlist.updated_at || playlist.created_at);
    const currentTs = parseDateTs(current.updated_at || current.created_at);

    if (nextTs >= currentTs) {
      byKey.set(key, playlist);
    }
  });

  return Array.from(byKey.values());
};

const normalizePlaylistCollection = (payload) => {
  const normalized = asArray(payload)
    .map(normalizePlaylist)
    .filter(Boolean)
    .filter((item) => !item.entityType || item.entityType === 'PLAYLIST');

  return dedupePlaylists(normalized);
};

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
  } catch { }
  return LIKED_PLAYLIST_KEY;
};

const clearLikedPlaylistCache = async () => {
  const cacheKey = await getLikedPlaylistCacheKey();
  localStorage.removeItem(cacheKey);
  localStorage.removeItem(LIKED_PLAYLIST_KEY);
  likedPlaylistPromise = null;
};

const clearLikedStateAfterDelete = async () => {
  try {
    const [{ store }, { setLikedSongs }] = await Promise.all([
      import('../store/store'),
      import('../store/authSlice'),
    ]);
    store.dispatch(setLikedSongs([]));
  } catch { }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('liked-songs-updated', { detail: { likedSongs: [] } }));
    } catch { }
  }
};

const createLikedPlaylistOnce = async () => {
  if (likedPlaylistCreatePromise) return likedPlaylistCreatePromise;

  likedPlaylistCreatePromise = (async () => {
    const created = await createPlaylist({ name: LIKED_PLAYLIST_NAME });
    if (created.success && created.data?.id) {
      const cacheKey = await getLikedPlaylistCacheKey();
      localStorage.setItem(cacheKey, created.data.id);
      return created.data.id;
    }
    return null;
  })();

  try {
    return await likedPlaylistCreatePromise;
  } finally {
    likedPlaylistCreatePromise = null;
  }
};

const getLikedPlaylistIdFromServer = async () => {
  const { ok, liked } = await fetchLikedCandidatesFromServer(2, 250);
  if (!ok) return null;
  if (liked.length === 0) return null;
  const keeper = liked
    .slice()
    .sort((a, b) => parseDateTs(b.updated_at || b.created_at) - parseDateTs(a.updated_at || a.created_at))[0];
  return keeper?.id || null;
};

const waitForLikedPlaylistIdFromServer = async (retries = 6, delayMs = 300) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const id = await getLikedPlaylistIdFromServer();
    if (id) return id;
    if (attempt < retries) await wait(delayMs);
  }
  return null;
};

export const getPlaylists = async () => {
  try {
    const data = await api.get('/playlists');
    return normalizePlaylistCollection(data);
  } catch {
    return [];
  }
};

export const getMyPlaylists = async ({ includeLiked = false } = {}) => {
  try {
    const data = await api.get('/playlists/me');
    const normalized = normalizePlaylistCollection(data);
    if (includeLiked) return normalized;
    return normalized.filter((playlist) => !isLikedPlaylistName(playlist.name));
  } catch {
    return [];
  }
};

export const getPlaylistById = async (id) => {
  try {
    const data = await api.get(`/playlists/${encodeURIComponent(id)}`);
    const normalized = normalizePlaylist(data?.data || data);
    if (!normalized) return null;

    try {
      const songsPayload = await api.get(`/playlists/${encodeURIComponent(id)}/songs`);
      normalized.songs = adaptPaginatedResponse(songsPayload, adaptSong);
    } catch {
      normalized.songs = Array.isArray(normalized.songs) ? normalized.songs : [];
    }

    return normalized;
  } catch {
    return null;
  }
};

export const createPlaylist = async (payload) => {
  const name = String(payload?.name || '').trim();
  if (!name) return { success: false, data: null, error: 'Tên playlist không hợp lệ' };

  try {
    const rawData = await api.post('/playlists', { name });
    const normalized = normalizePlaylist(rawData?.data || rawData);
    return { success: !!normalized, data: normalized };
  } catch {
    return { success: false, data: null };
  }
};

export const deletePlaylist = async (id, playlistName) => {
  try {
    let isDeletingLiked = isLikedPlaylistName(playlistName || '');
    if (!isDeletingLiked) {
      const allPlaylists = await getMyPlaylists({ includeLiked: true });
      const target = (Array.isArray(allPlaylists) ? allPlaylists : []).find((playlist) => playlist?.id === id);
      isDeletingLiked = isLikedPlaylistName(target?.name || '');
    }

    await api.delete(`/playlists/${encodeURIComponent(id)}`);
    const cacheKey = await getLikedPlaylistCacheKey();
    if (localStorage.getItem(cacheKey) === id) {
      await clearLikedPlaylistCache();
    }

    if (isDeletingLiked) {
      await clearLikedPlaylistCache();
      await clearLikedStateAfterDelete();
    }

    return { success: true };
  } catch {
    return { success: false };
  }
};

export const reorderPlaylistSongs = async (playlistId, songIds) => {
  try {
    await api.put(`/playlists/${encodeURIComponent(playlistId)}`, { songIds });
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const updatePlaylistName = async (playlistId, name) => {
  try {
    const data = await api.put(`/playlists/${encodeURIComponent(playlistId)}`, { name });
    const normalized = normalizePlaylist(data?.data || data);
    return { success: true, data: normalized };
  } catch {
    return { success: false };
  }
};

export const addSongToPlaylist = async (playlistId, song) => {
  if (!playlistId || !song?.song_id) return { success: false };
  try {
    await api.post(`/playlists/${encodeURIComponent(playlistId)}/songs`, { songId: song.song_id });
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  if (!playlistId || !songId) return { success: false };
  try {
    await api.delete(`/playlists/${encodeURIComponent(playlistId)}/songs/${encodeURIComponent(songId)}`);
    return { success: true };
  } catch {
    return { success: false };
  }
};

const resolveLikedPlaylistId = async ({ forceRefresh = false, ensureExists = true } = {}) => {
  const cacheKey = await getLikedPlaylistCacheKey();
  const cachedId = localStorage.getItem(cacheKey);

  if (!forceRefresh && cachedId) {
    return cachedId;
  }

  const { ok, liked } = await fetchLikedCandidatesFromServer(2, 250);

  if (!ok) {
    // Không chắc chắn trạng thái server => không tạo mới để tránh duplicate.
    return cachedId || null;
  }

  if (liked.length > 0) {
    const cachedItem = cachedId ? liked.find((item) => item.id === cachedId) : null;

    const keeper = cachedItem
      || liked.slice().sort((a, b) => parseDateTs(b.updated_at || b.created_at) - parseDateTs(a.updated_at || a.created_at))[0];

    localStorage.setItem(cacheKey, keeper.id);
    return keeper.id;
  }

  if (!ensureExists) {
    return null;
  }

  // Chỉ tạo khi đã xác nhận chắc chắn server chưa có liked playlist.
  return createLikedPlaylistOnce();
};

export const getLikedPlaylistId = async (forceRefresh = false) => {
  if (!forceRefresh && likedPlaylistPromise) return likedPlaylistPromise;

  likedPlaylistPromise = (async () => {
    try {
      return await resolveLikedPlaylistId({ forceRefresh, ensureExists: true });
    } catch {
      return null;
    }
  })();

  try {
    return await likedPlaylistPromise;
  } finally {
    likedPlaylistPromise = null;
  }
};

export const getExistingLikedPlaylistId = async (forceRefresh = false) => {
  try {
    return await resolveLikedPlaylistId({ forceRefresh, ensureExists: false });
  } catch {
    return null;
  }
};

export const getLikedSongs = async (options = {}) => {
  const { forceRefresh = false, retries = 2, retryDelayMs = 250, ensureExists = false } = options;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const playlistId = ensureExists
        ? await getLikedPlaylistId(forceRefresh || attempt > 0)
        : await getExistingLikedPlaylistId(forceRefresh || attempt > 0);
      if (!playlistId) return [];
      const data = await api.get(`/playlists/${encodeURIComponent(playlistId)}/songs`);
      return adaptPaginatedResponse(data, adaptSong);
    } catch {
      if (attempt < retries) {
        await wait(retryDelayMs);
      }
    }
  }

  return [];
};

export const likeSong = async (song) => {
  if (!song?.song_id) return { success: false, error: 'Invalid song data' };

  try {
    // Bắt buộc check response /playlists/me trước khi quyết định tạo mới.
    const serverState = await fetchLikedCandidatesFromServer(3, 300);
    if (!serverState.ok) {
      return { success: false, error: 'Không thể xác thực playlist yêu thích, vui lòng thử lại' };
    }

    let playlistId = null;

    if (serverState.liked.length > 0) {
      const cacheKey = await getLikedPlaylistCacheKey();
      const cachedId = localStorage.getItem(cacheKey);
      const cachedItem = cachedId ? serverState.liked.find((item) => item.id === cachedId) : null;
      const keeper = cachedItem
        || serverState.liked
          .slice()
          .sort((a, b) => parseDateTs(b.updated_at || b.created_at) - parseDateTs(a.updated_at || a.created_at))[0];
      playlistId = keeper?.id || null;
      if (playlistId) localStorage.setItem(cacheKey, playlistId);
    } else {
      const createdId = await createLikedPlaylistOnce();
      if (!createdId) return { success: false, error: 'Cannot create liked playlist' };

      const visibleId = await waitForLikedPlaylistIdFromServer(6, 300);
      playlistId = visibleId || createdId;

      const cacheKey = await getLikedPlaylistCacheKey();
      localStorage.setItem(cacheKey, playlistId);
    }

    if (!playlistId) {
      return { success: false, error: 'Playlist không tồn tại' };
    }

    // Retry ngay trên cùng playlistId để tránh tạo trùng do eventual consistency.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const retryCurrent = await addSongToPlaylist(playlistId, song);
      if (retryCurrent.success) return { success: true };
      await wait(300);
    }

    // Resolve lại từ server, có thể cache id cũ stale.
    const serverPlaylistId = await getLikedPlaylistIdFromServer();
    if (serverPlaylistId && serverPlaylistId !== playlistId) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const retryServer = await addSongToPlaylist(serverPlaylistId, song);
        if (retryServer.success) return { success: true };
        await wait(300);
      }
    }

    return { success: false, error: 'Playlist không tồn tại hoặc chưa sẵn sàng, vui lòng thử lại sau ít giây' };
  } catch {
    return { success: false, error: 'Failed to like song' };
  }
};

export const unlikeSong = async (songId) => {
  if (!songId || typeof songId !== 'string') {
    return { success: false, error: 'Invalid song ID format' };
  }

  try {
    const playlistId = await getExistingLikedPlaylistId(true);
    if (!playlistId) return { success: true };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await removeSongFromPlaylist(playlistId, songId);
      if (result.success) return { success: true };
      await wait(200);
    }

    const serverPlaylistId = await getLikedPlaylistIdFromServer();
    if (serverPlaylistId && serverPlaylistId !== playlistId) {
      return removeSongFromPlaylist(serverPlaylistId, songId);
    }

    return { success: false, error: 'Failed to unlike song' };
  } catch {
    return { success: false, error: 'Failed to unlike song' };
  }
};
