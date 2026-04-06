import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import settingsReducer from './settingsSlice';
import notificationReducer from './notificationSlice';
import editorialReducer from './editorialSlice';
import { logout } from './authSlice';
import { showToast } from './uiSlice';
import { setAuthExpiredCallback, setRequestFailedCallback } from '../services/apiClient';
import { addToHistoryLocal } from '../services/HistoryService';
import { recordPlay } from '../services/UserService';

const PLAYER_STATE_STORAGE_KEY = 'spotify_player_state_v1';

export const store = configureStore({
  reducer: {
    player: playerReducer,
    auth: authReducer,
    ui: uiReducer,
    settings: settingsReducer,
    notification: notificationReducer,
    editorial: editorialReducer,
  },
});

// Khi token hết hạn và không refresh được → tự động logout khỏi Redux
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

// ─── Single subscriber — gộp tất cả side effects vào 1 chỗ ──────────────────
// Init với bài đang restore từ localStorage để tránh ghi history khi app load
let _lastHistorySongId = store.getState().player.currentSong?.song_id ?? null;
let _debounceTimer = null;

store.subscribe(() => {
  const state = store.getState();

  // 1. Track play history khi song thay đổi
  const { currentSong } = state.player;
  if (currentSong && currentSong.song_id !== _lastHistorySongId) {
    _lastHistorySongId = currentSong.song_id;

    // localStorage: immediate (không debounce)
    addToHistoryLocal(currentSong);

    // API: debounce 1500ms để chống spam khi skip liên tục
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      const { isAuthenticated } = store.getState().auth;
      if (isAuthenticated && import.meta.env.VITE_API_URL) {
        recordPlay(currentSong).catch(() => {});
      }
    }, 1500);
  }

  // 3. Persist player state (currentSong + currentTime)
  if (typeof window !== 'undefined') {
    try {
      const { currentTime, isPlaying } = state.player;
      localStorage.setItem(PLAYER_STATE_STORAGE_KEY, JSON.stringify({
        currentSong: currentSong || null,
        currentTime: Number.isFinite(currentTime) ? currentTime : 0,
        isPlaying: !!isPlaying,
      }));
    } catch { }
  }
});
