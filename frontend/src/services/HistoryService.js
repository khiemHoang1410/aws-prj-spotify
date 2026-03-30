/**
 * HistoryService — Lịch sử nghe nhạc.
 * - localStorage: cache local, dùng khi offline hoặc chưa login
 * - API: sync lên BE khi đã login (POST /me/play-history)
 */
import { recordPlay, getPlayHistory, clearPlayHistory } from './UserService';

// Lazy import store để tránh circular dependency (store → HistoryService → store)
let _store = null;
const getStore = () => {
  if (!_store) _store = require('../store/store').store;
  return _store;
};

const HISTORY_KEY = 'spotify_play_history';
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

// ─── Public API ───────────────────────────────────────────────────────────────

export const addToHistory = (song) => {
  if (!song?.song_id) return;

  // 1. Cập nhật localStorage ngay lập tức (không block UI)
  let history = loadLocal().filter((s) => s.song_id !== song.song_id);
  history.unshift({ ...song, played_at: new Date().toISOString() });
  if (history.length > MAX_LOCAL_HISTORY) history = history.slice(0, MAX_LOCAL_HISTORY);
  saveLocal(history);

  // 2. Sync lên BE nếu đã login (fire-and-forget)
  const { isAuthenticated } = getStore().getState().auth;
  if (isAuthenticated) {
    recordPlay(song).catch(() => { /* ignore — không block UX */ });
  }
};

export const getHistory = async () => {
  const { isAuthenticated, user } = getStore().getState().auth;

  // Nếu đã login → lấy từ BE (source of truth)
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

  const { isAuthenticated } = getStore().getState().auth;
  if (isAuthenticated) {
    await clearPlayHistory().catch(() => { });
  }
};
