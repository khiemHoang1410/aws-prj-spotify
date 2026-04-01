/**
 * HistoryService — Lịch sử nghe nhạc.
 * - localStorage: update ngay lập tức (không debounce)
 * - API: chỉ gọi khi isAuthenticated = true (debounce xử lý ở store.js)
 */
import { recordPlay, getPlayHistory, clearPlayHistory } from './UserService';

const HISTORY_KEY = 'spotify_play_history';
const AUTH_SESSION_KEY = 'spotify_auth';
const MAX_LOCAL_HISTORY = 50;

// ─── Local cache ──────────────────────────────────────────────────────────────

const saveLocal = (history) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { }
};

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const getAuthFromSession = () => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return { isAuthenticated: false, user: null };
    const parsed = JSON.parse(raw);
    return {
      isAuthenticated: !!parsed?.accessToken,
      user: parsed?.user || null,
    };
  } catch {
    return { isAuthenticated: false, user: null };
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Cập nhật localStorage ngay lập tức — không debounce, không cần auth */
export const addToHistoryLocal = (song) => {
  if (!song?.song_id) return;

  // 1. Cập nhật localStorage ngay lập tức (không block UI)
  let history = loadLocal().filter((s) => s.song_id !== song.song_id);
  history.unshift({ ...song, played_at: new Date().toISOString() });
  if (history.length > MAX_LOCAL_HISTORY) history = history.slice(0, MAX_LOCAL_HISTORY);
  saveLocal(history);
};

/** Gọi API ghi history — chỉ khi isAuthenticated = true */
export const addToHistoryRemote = (song, ctx = {}) => {
  if (!song?.song_id) return;
  if (!import.meta.env.VITE_API_URL) return;

  const auth = {
    ...getAuthFromSession(),
    ...ctx,
  };
  const { isAuthenticated } = auth;
  if (!isAuthenticated) return;

  recordPlay(song).catch((err) => { console.warn('[HistoryService] recordPlay failed:', err); });
};

/** Backward compat — gọi cả local + remote (không debounce) */
export const addToHistory = (song, ctx = {}) => {
  addToHistoryLocal(song);
  addToHistoryRemote(song, ctx);
};

export const getHistory = async (ctx = {}) => {
  const auth = {
    ...getAuthFromSession(),
    ...ctx,
  };
  const { isAuthenticated, user } = auth;

  if (isAuthenticated && user?.user_id) {
    try {
      const result = await getPlayHistory(user.user_id);
      const items = (result?.items || []).map(item => ({
        song_id: item.songId,
        title: item.songTitle,
        artist_name: item.artistName || '',
        artist_id: item.artistId || null,
        image_url: item.coverUrl || null,
        duration: item.duration || 0,
        played_at: item.playedAt,
      }));
      return items;
    } catch {
      return loadLocal();
    }
  }

  return loadLocal();
};

export const clearHistory = async () => {
  saveLocal([]);
  const { isAuthenticated } = getAuthFromSession();
  if (isAuthenticated) {
    await clearPlayHistory().catch(() => { });
  }
};
