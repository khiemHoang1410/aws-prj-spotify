import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import settingsReducer from './settingsSlice';
import notificationReducer from './notificationSlice';
import { logout } from './authSlice';
import { showToast } from './uiSlice';
import { setAuthExpiredCallback, setRequestFailedCallback } from '../services/apiClient';
import { addToHistoryLocal, addToHistoryRemote } from '../services/HistoryService';

const PLAYER_STATE_STORAGE_KEY = 'spotify_player_state_v1';

export const store = configureStore({
  reducer: {
    player: playerReducer,
    auth: authReducer,
    ui: uiReducer,
    settings: settingsReducer,
    notification: notificationReducer,
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
<<<<<<< HEAD
// Init với bài đang restore từ localStorage để tránh ghi history khi app load
let _lastHistorySongId = store.getState().player.currentSong?.song_id ?? null;
let _lastLikedSongsRef = null;
let _debounceTimer = null;
=======
let _lastHistorySongId = null;
let _lastLikedSongsRef = null;
>>>>>>> a61e1ca (refactor: optimize PlayHistoryRepository, store subscribers, circular dep)

store.subscribe(() => {
  const state = store.getState();

  // 1. Persist liked songs theo user
  const { isAuthenticated, user, likedSongs } = state.auth;
  if (isAuthenticated && user?.user_id && likedSongs !== _lastLikedSongsRef) {
    _lastLikedSongsRef = likedSongs;
    localStorage.setItem(`spotify_liked_${user.user_id}`, JSON.stringify(likedSongs));
  }

  // 2. Track play history khi song thay đổi
  const { currentSong } = state.player;
  if (currentSong && currentSong.song_id !== _lastHistorySongId) {
    _lastHistorySongId = currentSong.song_id;
<<<<<<< HEAD

    // localStorage: immediate (không debounce)
    addToHistoryLocal(currentSong);

    // API: debounce 1500ms để chống spam khi skip liên tục
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => addToHistoryRemote(currentSong), 1500);
  }

=======
    addToHistory(currentSong);
  }

>>>>>>> a61e1ca (refactor: optimize PlayHistoryRepository, store subscribers, circular dep)
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

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    persistPlayerState();
  });
}
