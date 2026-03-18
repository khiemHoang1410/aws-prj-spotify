import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSong: null, // Bài hát đang phát
  isPlaying: false,  // Trạng thái Play/Pause
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    // Hành động 1: Chọn một bài hát mới để phát
    setCurrentSong: (state, action) => {
      state.currentSong = action.payload;
      state.isPlaying = true; // Khi chọn bài mới thì tự động Play
    },
    // Hành động 2: Bật/Tắt Play/Pause
    togglePlay: (state) => {
      if (state.currentSong) {
        state.isPlaying = !state.isPlaying;
      }
    },
  },
});

export const { setCurrentSong, togglePlay } = playerSlice.actions;
export default playerSlice.reducer;