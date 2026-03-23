import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import authReducer from './authSlice';
import uiReducer from './uiSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    player: playerReducer,
    auth: authReducer,
    ui: uiReducer,
    settings: settingsReducer,
  },
});