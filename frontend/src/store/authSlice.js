import { createSlice } from '@reduxjs/toolkit';
import { VERIFY_STATUS } from '../constants/enums';

const initialState = {
  isAuthenticated: false,
  user: null,
  isModalOpen: false,
  modalType: 'login',
  likedSongs: [],
  verifyStatus: VERIFY_STATUS.IDLE,
  verifyMessage: '',
  followedArtists: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    openModal: (state, action) => {
      state.isModalOpen = true;
      state.modalType = action.payload || 'login';
    },
    closeModal: (state) => {
      state.isModalOpen = false;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.isModalOpen = false;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.likedSongs = [];
      state.verifyStatus = VERIFY_STATUS.IDLE;
      state.verifyMessage = '';
      state.followedArtists = [];
    },
    toggleLikeSong: (state, action) => {
      const song = action.payload;
      const index = state.likedSongs.findIndex(s => s.song_id === song.song_id);
      if (index >= 0) {
        state.likedSongs.splice(index, 1);
      } else {
        state.likedSongs.push(song);
      }
    },
    setVerifyStatus: (state, action) => {
      state.verifyStatus = action.payload.status;
      state.verifyMessage = action.payload.message || '';
    },
    setFollowedArtists: (state, action) => {
      state.followedArtists = action.payload;
    },
    toggleFollowArtist: (state, action) => {
      const artistName = action.payload;
      const index = state.followedArtists.indexOf(artistName);
      if (index >= 0) {
        state.followedArtists.splice(index, 1);
      } else {
        state.followedArtists.push(artistName);
      }
    },
  },
});

export const { openModal, closeModal, loginSuccess, logout, toggleLikeSong, setVerifyStatus, setFollowedArtists, toggleFollowArtist } = authSlice.actions;
export default authSlice.reducer;