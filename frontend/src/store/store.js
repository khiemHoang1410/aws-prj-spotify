import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import settingsReducer from './settingsSlice';
import notificationReducer from './notificationSlice';
import editorialReducer from './editorialSlice';
import playlistsReducer from './playlistSlice';
import historyReducer, {
  addEntryOptimistic,
  confirmEntry,
  saveLocal,
} from './historySlice';
import { syncOnLogin, loadHistory } from './historySlice';
import { logout } from './authSlice';
import { showToast } from './uiSlice';
import { fetchMyPlaylists } from './playlistSlice';
import { setAuthExpiredCallback, setRequestFailedCallback } from '../services/apiClient';

const PLAYER_STATE_STORAGE_KEY = 'spotify_player_state_v1';
const API_DEBOUNCE_MS = 3000;

export const store = configureStore({
  reducer: {
    player: playerReducer,
    auth: authReducer,
    ui: uiReducer,
    settings: settingsReducer,
    notification: notificationReducer,
    editorial: editorialReducer,
    history: historyReducer,
    playlists: playlistsReducer,
  },
});

// Khi token hết hạn → tự động logout
setAuthExpiredCallback(() => {
  store.dispatch(logout());
  store.dispatch(showToast({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', type: 'error' }));
});

let lastToastMessage = '';
let lastToastAt = 0;

setRequestFailedCallback((message) => {
  const now = Date.now();
  if (message === lastToastMessage && now - lastToastAt < 2500) return;
  lastToastMessage = message;
  lastToastAt = now;
  store.dispatch(showToast({ message, type: 'error' }));
});

// ─── Play History — debounce 3 giây ─────────────────────────────────────────
// Optimistic update: ngay lập tức vào Redux + localStorage
// API call: chỉ gọi nếu bài vẫn đang phát sau 3 giây

let _lastHistorySongId = store.getState().player.currentSong?.song_id ?? null;
let _debounceTimer = null;
let _apiCalledForCurrentSong = false;

store.subscribe(() => {
  const state = store.getState();
  const { currentSong } = state.player;

  // 1. Track play history khi song thay đổi
  if (currentSong && currentSong.song_id !== _lastHistorySongId) {
    _lastHistorySongId = currentSong.song_id;
    _apiCalledForCurrentSong = false;

    // Optimistic update ngay lập tức
    store.dispatch(addEntryOptimistic(currentSong));

    // Lưu localStorage ngay (cho guest + fallback)
    const currentEntries = store.getState().history.entries;
    saveLocal(currentEntries);

    // Hủy timer cũ (bài trước chưa đủ 3 giây)
    clearTimeout(_debounceTimer);

    // Set timer 3 giây — chỉ gọi API nếu bài không đổi
    const songIdAtDispatch = currentSong.song_id;
    const tempId = `temp-${Date.now()}`;
    void tempId; // used in confirmEntry below

    _debounceTimer = setTimeout(async () => {
      // Kiểm tra bài vẫn là bài này
      const latestSong = store.getState().player.currentSong;
      if (latestSong?.song_id !== songIdAtDispatch) return;
      if (_apiCalledForCurrentSong) return;

      const { isAuthenticated } = store.getState().auth;
      if (!isAuthenticated || !import.meta.env.VITE_API_URL) return;

      _apiCalledForCurrentSong = true;

      try {
        const { default: apiClient } = await import('../services/apiClient');
        const serverEntry = await apiClient.post('/me/play-history', {
          songId: currentSong.song_id,
          songTitle: currentSong.title,
          artistId: currentSong.artist_id || null,
          artistName: currentSong.artist_name || null,
          coverUrl: currentSong.image_url || null,
          duration: currentSong.duration || null,
        });
        if (serverEntry?.entryId) {
          store.dispatch(confirmEntry({ tempId: `temp-${Date.now() - API_DEBOUNCE_MS}`, serverEntry }));
        }
      } catch { /* giữ nguyên optimistic entry */ }
    }, API_DEBOUNCE_MS);
  }

  // 2. Persist player state
  if (typeof window !== 'undefined') {
    try {
      const { currentTime, isPlaying } = state.player;
      localStorage.setItem(PLAYER_STATE_STORAGE_KEY, JSON.stringify({
        currentSong: currentSong || null,
        currentTime: Number.isFinite(currentTime) ? currentTime : 0,
        isPlaying: !!isPlaying,
      }));
    } catch { /* ignore */ }
  }
});

// ─── Auth events ──────────────────────────────────────────────────────────────

let _prevAuthState = store.getState().auth;

store.subscribe(() => {
  const state = store.getState();
  const prevAuth = _prevAuthState;
  _prevAuthState = state.auth;

  // loginSuccess: load history + sync localStorage
  if (!prevAuth.isAuthenticated && state.auth.isAuthenticated) {
    store.dispatch(loadHistory());
    store.dispatch(syncOnLogin());
    store.dispatch(fetchMyPlaylists());
  }
});

// Load history khi app khởi động (guest dùng localStorage, user đã login dùng API)
store.dispatch(loadHistory());
