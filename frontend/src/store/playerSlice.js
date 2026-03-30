import { createSlice } from '@reduxjs/toolkit';
import { REPEAT_MODE } from '../constants/enums';

const PLAYER_STATE_STORAGE_KEY = 'spotify_player_state_v1';

const loadPersistedPlayerState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const rawState = localStorage.getItem(PLAYER_STATE_STORAGE_KEY);
    if (!rawState) return null;
    const parsedState = JSON.parse(rawState);
    const hasSong = !!parsedState?.currentSong?.song_id;
    if (!hasSong) return null;
    return {
      currentSong: parsedState.currentSong,
      currentTime: Number.isFinite(parsedState.currentTime) ? parsedState.currentTime : 0,
      // Giữ nguyên trạng thái play/pause trước khi reload
      isPlaying: !!parsedState.isPlaying,
    };
  } catch {
    return null;
  }
};

const persistedPlayerState = loadPersistedPlayerState();

const initialState = {
  currentSong: persistedPlayerState?.currentSong || null,
  isPlaying: persistedPlayerState?.isPlaying || false,
  currentTime: persistedPlayerState?.currentTime || 0,
  globalSeekTime: null,
  queue: [],
  history: [],
  isShuffle: false,
  repeatMode: REPEAT_MODE.OFF,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setCurrentSong: (state, action) => {
      if (state.currentSong) {
        state.history.push(state.currentSong);
        if (state.history.length > 50) state.history.shift();
      }
      state.currentSong = action.payload;
      state.isPlaying = true;
      state.currentTime = 0;
    },
    togglePlay: (state) => {
      if (state.currentSong) state.isPlaying = !state.isPlaying;
    },
    updateCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    seekToTime: (state, action) => {
      state.globalSeekTime = action.payload;
    },
    clearSeekTime: (state) => {
      state.globalSeekTime = null;
    },
    addToQueue: (state, action) => {
      // Chặn thêm trùng bài vào hàng chờ
      const isExist = state.queue.some(song => song.song_id === action.payload.song_id);
      if (!isExist) state.queue.push(action.payload);
    },
    clearQueue: (state) => {
      state.queue = [];
    },
    playNextSong: (state) => {
      if (state.queue.length > 0) {
        if (state.currentSong) {
          state.history.push(state.currentSong);
          if (state.history.length > 50) state.history.shift();
        }
        if (state.isShuffle) {
          const randomIndex = Math.floor(Math.random() * state.queue.length);
          state.currentSong = state.queue[randomIndex];
          state.queue.splice(randomIndex, 1);
        } else {
          state.currentSong = state.queue[0];
          state.queue.shift();
        }
        state.isPlaying = true;
        state.currentTime = 0;
      } else {
        state.isPlaying = false;
        state.currentTime = 0;
      }
    },
    playPreviousSong: (state) => {
      if (state.history.length > 0) {
        if (state.currentSong) {
          state.queue.unshift(state.currentSong);
        }
        state.currentSong = state.history[state.history.length - 1];
        state.history.pop();
        state.isPlaying = true;
        state.currentTime = 0;
      }
      // Nếu không có history: PlayerBar sẽ seek về 0 thay vì dispatch action này
    },
    toggleShuffle: (state) => {
      state.isShuffle = !state.isShuffle;
    },
    setShuffleMode: (state, action) => {
      state.isShuffle = action.payload;
    },
    cycleRepeat: (state) => {
      if (state.repeatMode === 'off') state.repeatMode = 'all';
      else if (state.repeatMode === 'all') state.repeatMode = 'one';
      else state.repeatMode = 'off';
    },
  },
});

export const {
  setCurrentSong, togglePlay, updateCurrentTime, seekToTime, clearSeekTime,
  addToQueue, clearQueue, playNextSong, playPreviousSong, toggleShuffle, setShuffleMode, cycleRepeat,
} = playerSlice.actions;
export default playerSlice.reducer;
