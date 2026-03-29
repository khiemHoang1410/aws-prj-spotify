import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import settingsReducer from './settingsSlice';
import notificationReducer from './notificationSlice';
import { logout } from './authSlice';
import { showToast } from './uiSlice';
import { setAuthExpiredCallback } from '../services/apiClient';

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
