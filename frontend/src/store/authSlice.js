import { createSlice } from '@reduxjs/toolkit';
import { VERIFY_STATUS } from '../constants/enums';
import { likeSong, unlikeSong, getLikedSongs } from '../services/SongService';
import { showToast } from './uiSlice';

const initialState = {
  isAuthenticated: false,
  user: null,
  isModalOpen: false,
  modalType: 'login',
  likedSongs: [],
  verifyStatus: VERIFY_STATUS.IDLE,
  verifyMessage: '',
  followedArtists: [],
  forgotPasswordModalOpen: false,
  loginPrefillEmail: '',
  isRestoring: true, // true until session restore completes on mount
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
      // Restore verifyStatus từ user data nếu có
      if (action.payload?.verifyStatus) {
        state.verifyStatus = action.payload.verifyStatus;
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.likedSongs = [];
      state.verifyStatus = VERIFY_STATUS.IDLE;
      state.verifyMessage = '';
      state.followedArtists = [];
      state.isRestoring = false;
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
    setLikedSongs: (state, action) => {
      state.likedSongs = action.payload;
    },
    openForgotPasswordModal: (state) => {
      state.forgotPasswordModalOpen = true;
    },
    closeForgotPasswordModal: (state) => {
      state.forgotPasswordModalOpen = false;
    },
    setLoginPrefillEmail: (state, action) => {
      state.loginPrefillEmail = action.payload;
    },
    setRestoring: (state, action) => {
      state.isRestoring = action.payload;
    },
  },
});

export const { openModal, closeModal, loginSuccess, logout, toggleLikeSong, setVerifyStatus, setFollowedArtists, toggleFollowArtist, setLikedSongs, openForgotPasswordModal, closeForgotPasswordModal, setLoginPrefillEmail, setRestoring } = authSlice.actions;
export default authSlice.reducer;

// Thunk: optimistic update + API like/unlike
export const toggleLikeSongThunk = (song) => async (dispatch, getState) => {
  const { likedSongs } = getState().auth;
  const isLiked = likedSongs.some((s) => s.song_id === song.song_id);

  // Optimistic update
  dispatch(toggleLikeSong(song));

  try {
    const result = isLiked
      ? await unlikeSong(song.song_id)
      : await likeSong(song.song_id);

    if (!result?.success) {
      // Rollback
      dispatch(toggleLikeSong(song));
      dispatch(showToast({ message: 'Lỗi cập nhật yêu thích, vui lòng thử lại', type: 'error' }));
      return;
    }

    // Sync fresh list từ server
    const fresh = await getLikedSongs();
    dispatch(setLikedSongs(fresh));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('liked-songs-updated', {
        detail: { song, action: isLiked ? 'unlike' : 'like' },
      }));
    }
  } catch {
    dispatch(toggleLikeSong(song));
    dispatch(showToast({ message: 'Lỗi cập nhật yêu thích, vui lòng thử lại', type: 'error' }));
  }
};
