import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'spotify_settings';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const defaultSettings = {
  language: 'vi',
  audioQuality: 'high',
  autoplay: true,
  showLyrics: true,
  notifications: true,
  theme: 'dark',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { ...defaultSettings, ...(loadFromStorage() || {}) },
  reducers: {
    updateSetting: (state, action) => {
      const { key, value } = action.payload;
      if (key in defaultSettings) {
        state[key] = value;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, [key]: value }));
        } catch {
          // ignore storage errors
        }
      }
    },
    resetSettings: (state) => {
      Object.assign(state, defaultSettings);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  },
});

export const { updateSetting, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
