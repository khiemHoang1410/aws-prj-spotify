import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import settingsReducer from './settingsSlice';
import notificationReducer from './notificationSlice';
import { logout } from './authSlice';
import { showToast } from './uiSlice';
import { setAuthExpiredCallback, setRequestFailedCallback } from '../services/apiClient';
import { addToHistory } from '../services/HistoryService';

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

// Persist liked songs vào localStorage theo user_id để không mất sau reload
store.subscribe(() => {
  const { isAuthenticated, user, likedSongs } = store.getState().auth;
  if (isAuthenticated && user?.user_id) {
    localStorage.setItem(`spotify_liked_${user.user_id}`, JSON.stringify(likedSongs));
  }
});

// Ghi lịch sử nghe nhạc khi currentSong thay đổi
let _lastHistorySongId = null;
store.subscribe(() => {
  const { currentSong } = store.getState().player;
  if (currentSong && currentSong.song_id !== _lastHistorySongId) {
    _lastHistorySongId = currentSong.song_id;
    addToHistory(currentSong);
  }
});

const persistPlayerState = () => {
  if (typeof window === 'undefined') return;
  try {
    const { currentSong, currentTime, isPlaying } = store.getState().player;
    const safeTime = Number.isFinite(currentTime) ? currentTime : 0;
    localStorage.setItem(PLAYER_STATE_STORAGE_KEY, JSON.stringify({
      currentSong: currentSong || null,
      currentTime: safeTime,
      isPlaying: !!isPlaying,
    }));
  } catch {
    // Ignore localStorage errors to avoid breaking app flow
  }
};

// Persist current song + current time liên tục để reload vào lại đúng trạng thái
store.subscribe(() => {
  persistPlayerState();
});

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    persistPlayerState();
  });
}
