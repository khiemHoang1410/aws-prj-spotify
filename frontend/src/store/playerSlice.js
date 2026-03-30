import { createSlice } from '@reduxjs/toolkit';
import { REPEAT_MODE } from '../constants/enums';

const initialState = {
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  globalSeekTime: null,
  queue: [],
  isShuffle: false,
  repeatMode: REPEAT_MODE.OFF,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setCurrentSong: (state, action) => {
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
  addToQueue, clearQueue, playNextSong, toggleShuffle, setShuffleMode, cycleRepeat,
} = playerSlice.actions;
export default playerSlice.reducer;
