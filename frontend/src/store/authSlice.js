import { createSlice } from '@reduxjs/toolkit';
import { VERIFY_STATUS } from '../constants/enums';
import { likeSong, unlikeSong, getLikedSongs } from '../services/PlaylistService';
import { showToast } from './uiSlice';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  },
});

export const { openModal, closeModal, loginSuccess, logout, toggleLikeSong, setVerifyStatus, setFollowedArtists, toggleFollowArtist, setLikedSongs } = authSlice.actions;
export default authSlice.reducer;

// Thunk: optimistic update + persist to backend playlist "Yêu thích"
// Includes: error handling, rollback, and user notification
export const toggleLikeSongThunk = (song) => async (dispatch, getState) => {
  const { likedSongs } = getState().auth;
  const isLiked = likedSongs.some((s) => s.song_id === song.song_id);
  
  // Optimistic update
  dispatch(toggleLikeSong(song));
  
  try {
    if (isLiked) {
      // Remove from liked
      const result = await unlikeSong(song.song_id);
      if (!result?.success) {
        // Rollback: re-add to liked
        dispatch(toggleLikeSong(song));
        // Notify error via uiSlice (import at top of file)
        dispatch(showToast({
          message: `Lỗi bỏ thích: ${result?.error || 'Vui lòng thử lại'}`,
          type: 'error',
        }));
        return;
      }
    } else {
      // Add to liked
      const result = await likeSong(song);
      if (!result?.success) {
        // Rollback: remove from liked
        dispatch(toggleLikeSong(song));
        dispatch(showToast({
          message: `Lỗi thích bài hát: ${result?.error || 'Vui lòng thử lại'}`,
          type: 'error',
        }));
        return;
      }
    }
    
    // Success: fetch fresh liked songs from server + sync Redux
    const eventDetail = {
      song,
      action: isLiked ? 'unlike' : 'like',
    };
    try {
      const expectedLikedAfterAction = !isLiked;
      let synced = false;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const freshLikedSongs = await getLikedSongs({
          forceRefresh: true,
          retries: 2,
          retryDelayMs: 250,
          ensureExists: true,
        });

        const hasSongInFresh = freshLikedSongs.some((s) => s.song_id === song.song_id);
        if (hasSongInFresh === expectedLikedAfterAction) {
          dispatch(setLikedSongs(freshLikedSongs));
          synced = true;
          break;
        }

        await sleep(250);
      }

      if (!synced) {
        const optimisticLikedSongs = getState().auth.likedSongs;
        dispatch(setLikedSongs(optimisticLikedSongs));
      }
    } finally {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('liked-songs-updated', {
          detail: eventDetail,
        }));
      }
    }
  } catch (_error) {
    // Rollback on exception
    dispatch(toggleLikeSong(song));
    dispatch(showToast({
      message: 'Lỗi cập nhật yêu thích, vui lòng thử lại',
      type: 'error',
    }));
  }
};
