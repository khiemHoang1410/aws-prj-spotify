import { createSlice } from '@reduxjs/toolkit';
import apiClient from '../services/apiClient';

const HISTORY_KEY = 'spotify_play_history';
const MAX_ENTRIES = 50;
const MAX_SYNC_ENTRIES = 10;

// ─── localStorage helpers ─────────────────────────────────────────────────────

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveLocal = (entries) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch { /* ignore */ }
};

const clearLocal = () => {
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
};

// ─── Normalize entry từ API response ─────────────────────────────────────────

export const normalizeHistoryEntry = (item) => ({
  entryId: item.entryId || item.sk || null,
  songId: item.songId || item.song_id || null,
  title: item.songTitle || item.title || '',
  artist_name: item.artistName || item.artist_name || '',
  artist_id: item.artistId || item.artist_id || null,
  image_url: item.coverUrl || item.image_url || null,
  audio_url: item.audioUrl || item.audio_url || null, // cần để Sidebar phát lại đúng bài
  duration: item.duration || 0,
  played_at: item.playedAt || item.played_at || new Date().toISOString(),
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  entries: [],
  hasMore: true,
  nextCursor: null,
  isLoading: false,
  isSyncing: false,
  hasSyncedOnLogin: false,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addEntryOptimistic(state, action) {
      const song = action.payload;
      const tempEntry = {
        entryId: `temp-${Date.now()}`,
        songId: song.song_id,
        title: song.title || '',
        artist_name: song.artist_name || '',
        artist_id: song.artist_id || null,
        image_url: song.image_url || null,
        audio_url: song.audio_url || null, // phải lưu để Sidebar có thể phát lại
        duration: song.duration || 0,
        played_at: new Date().toISOString(),
        _isTemp: true,
      };
      // Xóa entry cũ của cùng bài hát (temp hoặc confirmed) trước khi thêm mới
      const filtered = state.entries.filter((e) => e.songId !== song.song_id);
      state.entries = [tempEntry, ...filtered].slice(0, MAX_ENTRIES);
    },

    confirmEntry(state, action) {
      const { tempId, serverEntry } = action.payload;
      const idx = state.entries.findIndex((e) => e.entryId === tempId);
      if (idx !== -1) {
        state.entries[idx] = { ...normalizeHistoryEntry(serverEntry), _isTemp: false };
      }
    },

    removeEntry(state, action) {
      state.entries = state.entries.filter((e) => e.entryId !== action.payload);
    },

    clearEntries(state) {
      state.entries = [];
      state.hasMore = true;
      state.nextCursor = null;
    },

    setEntries(state, action) {
      const { items, nextCursor } = action.payload;
      // Dedup theo songId — giữ entry mới nhất (đầu tiên trong array)
      const seen = new Set();
      const deduped = items.map(normalizeHistoryEntry).filter((e) => {
        if (!e.songId || seen.has(e.songId)) return false;
        seen.add(e.songId);
        return true;
      });
      state.entries = deduped;
      state.nextCursor = nextCursor || null;
      state.hasMore = !!nextCursor;
      state.isLoading = false;
    },

    appendEntries(state, action) {
      const { items, nextCursor } = action.payload;
      const normalized = items.map(normalizeHistoryEntry);
      // Dedup: không thêm entry có songId đã tồn tại
      const existingSongIds = new Set(state.entries.map((e) => e.songId));
      const newEntries = normalized.filter((e) => e.songId && !existingSongIds.has(e.songId));
      state.entries = [...state.entries, ...newEntries];
      state.nextCursor = nextCursor || null;
      state.hasMore = !!nextCursor;
      state.isLoading = false;
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setSyncing(state, action) {
      state.isSyncing = action.payload;
    },

    markSyncedOnLogin(state) {
      state.hasSyncedOnLogin = true;
    },
  },
  extraReducers: (builder) => {
    // Clear history khi user logout
    builder.addMatcher(
      (action) => action.type === 'auth/logout',
      () => {
        clearLocal();
        return { ...initialState };
      }
    );
  },
});

export const {
  addEntryOptimistic,
  confirmEntry,
  removeEntry,
  clearEntries,
  setEntries,
  appendEntries,
  setLoading,
  setSyncing,
  markSyncedOnLogin,
} = historySlice.actions;

// ─── Thunks ───────────────────────────────────────────────────────────────────

/** Load history lần đầu khi app khởi động */
export const loadHistory = () => async (dispatch, getState) => {
  const { isAuthenticated, user, isRestoring } = getState().auth;

  // Chờ session restore xong — nếu đang restore thì không làm gì,
  // auth subscriber trong store.js sẽ gọi lại sau khi loginSuccess
  if (isRestoring) return;

  dispatch(setLoading(true));

  if (!isAuthenticated || !user?.user_id || !import.meta.env.VITE_API_URL) {
    // User chưa đăng nhập và session đã restore xong → không load localStorage
    // (tránh hiển thị history của session cũ sau khi logout)
    dispatch(setEntries({ items: [], nextCursor: null }));
    return;
  }

  try {
    const res = await apiClient.get(`/users/${user.user_id}/play-history?limit=20`, { silent: true });
    dispatch(setEntries({ items: res?.items || [], nextCursor: res?.nextCursor || null }));
  } catch {
    // Fallback localStorage nếu API lỗi (chỉ khi đã authenticated)
    const local = loadLocal();
    dispatch(setEntries({ items: local, nextCursor: null }));
  }
};

/** Load thêm entries (infinite scroll) */
export const loadMoreHistory = () => async (dispatch, getState) => {
  const { nextCursor, isLoading, hasMore } = getState().history;
  const { user } = getState().auth;
  if (!hasMore || isLoading || !nextCursor || !user?.user_id) return;

  dispatch(setLoading(true));
  try {
    const res = await apiClient.get(
      `/users/${user.user_id}/play-history?limit=20&cursor=${encodeURIComponent(nextCursor)}`
    );
    dispatch(appendEntries({ items: res?.items || [], nextCursor: res?.nextCursor || null }));
  } catch {
    dispatch(setLoading(false));
  }
};

/** Xóa một entry (optimistic) */
export const deleteEntry = (entryId) => async (dispatch, getState) => {
  dispatch(removeEntry(entryId));
  const { isAuthenticated } = getState().auth;
  if (!isAuthenticated || !import.meta.env.VITE_API_URL) return;
  try {
    await apiClient.delete(`/me/play-history/${encodeURIComponent(entryId)}`);
  } catch { /* optimistic — không rollback */ }
};

/** Xóa toàn bộ history */
export const clearAllHistory = () => async (dispatch, getState) => {
  const { isAuthenticated } = getState().auth;
  if (!isAuthenticated || !import.meta.env.VITE_API_URL) {
    dispatch(clearEntries());
    clearLocal();
    return;
  }
  try {
    await apiClient.delete('/me/play-history');
    dispatch(clearEntries());
    clearLocal();
  } catch {
    // Không xóa Redux state nếu API thất bại — toast sẽ được hiển thị qua setRequestFailedCallback
  }
};

/** Sync localStorage lên API sau khi đăng nhập */
export const syncOnLogin = () => async (dispatch, getState) => {
  const { hasSyncedOnLogin } = getState().history;
  if (hasSyncedOnLogin) return;

  dispatch(markSyncedOnLogin()); // đánh dấu ngay để tránh double sync
  dispatch(setSyncing(true));

  const local = loadLocal();
  if (!local.length || !import.meta.env.VITE_API_URL) {
    dispatch(setSyncing(false));
    return;
  }

  // Lấy tối đa 10 entries, từ cũ nhất đến mới nhất
  const toSync = local.slice(-MAX_SYNC_ENTRIES).reverse();

  for (const entry of toSync) {
    try {
      await apiClient.post('/me/play-history', {
        songId: entry.songId || entry.song_id,
        songTitle: entry.title || entry.songTitle,
        artistId: entry.artist_id || entry.artistId || null,
        artistName: entry.artist_name || entry.artistName || null,
        coverUrl: entry.image_url || entry.coverUrl || null,
        duration: entry.duration || null,
      });
    } catch { /* bỏ qua entry lỗi, tiếp tục */ }
  }

  clearLocal();
  dispatch(setSyncing(false));

  // Reload history từ API sau khi sync xong
  dispatch(loadHistory());
};

export { loadLocal, saveLocal, clearLocal };
export default historySlice.reducer;
