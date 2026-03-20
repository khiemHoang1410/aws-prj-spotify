import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './playerSlice';
import authReducer from './authSlice'; // Thêm dòng này
import uiReducer from './uiSlice'; // Thêm dòng này

export const store = configureStore({
  reducer: {
    player: playerReducer,
    auth: authReducer, // Thêm dòng này
    ui: uiReducer, // Thêm dòng này
  },
});