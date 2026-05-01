import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { REPEAT_MODE } from '../constants/enums';
import { fetchTrendingSongs } from '../services/RecommendationService';
import { getAlbumSongs } from '../services/AlbumService';
import api from '../services/apiClient';
import { adaptSong } from '../services/adapters';

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
  lyricsOffset: 0,
  currentPlaylistId: null,
  currentPlaylistName: null,
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
    // Play một bài trong context danh sách — tự động set queue = các bài còn lại
    // payload: { song, songs: Song[], keepManualQueue?: boolean }
    playWithContext: (state, action) => {
      const { song, songs = [], keepManualQueue = false } = action.payload;

      if (state.currentSong) {
        state.history.push(state.currentSong);
        if (state.history.length > 50) state.history.shift();
      }
      state.currentSong = song;
      state.isPlaying = true;
      state.currentTime = 0;

      if (keepManualQueue && state.queue.length > 0) return;

      const idx = songs.findIndex((s) => s.song_id === song.song_id);
      const remaining = idx >= 0 ? songs.slice(idx + 1) : [];

      if (state.isShuffle && remaining.length > 0) {
        const shuffled = [...remaining];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        state.queue = shuffled;
      } else {
        state.queue = remaining;
      }
    },
    setCurrentPlaylistContext: (state, action) => {
      state.currentPlaylistId = action.payload?.id ?? null;
      state.currentPlaylistName = action.payload?.name ?? null;
    },
    clearCurrentPlaylistContext: (state) => {
      state.currentPlaylistId = null;
      state.currentPlaylistName = null;
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
      const isExist = state.queue.some(song => song.song_id === action.payload.song_id);
      if (!isExist) state.queue.push(action.payload);
    },
    clearQueue: (state) => {
      state.queue = [];
    },
    // Jump đến một bài cụ thể trong queue — xóa bài đó và tất cả bài trước nó
    // Giống Spotify: click bài số 5 → bài 1-4 bị bỏ qua, bài 5 thành currentSong, queue = bài 6+
    jumpToQueueItem: (state, action) => {
      const targetId = action.payload; // song_id của bài muốn nhảy tới
      const idx = state.queue.findIndex(s => s.song_id === targetId);
      if (idx === -1) return;

      const targetSong = state.queue[idx];
      if (state.currentSong) {
        state.history.push(state.currentSong);
        if (state.history.length > 50) state.history.shift();
      }
      state.currentSong = targetSong;
      state.isPlaying = true;
      state.currentTime = 0;
      // Xóa bài đó và tất cả bài trước nó — giữ lại bài sau
      state.queue = state.queue.slice(idx + 1);
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
    adjustLyricsOffset: (state, action) => {
      state.lyricsOffset = Math.round((state.lyricsOffset + action.payload) * 10) / 10;
    },
    resetLyricsOffset: (state) => {
      state.lyricsOffset = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action) => action.type === 'playlists/deletePlaylist/fulfilled',
      (state, action) => {
        const deletedId = action.payload;
        if (state.currentPlaylistId === deletedId) {
          state.currentPlaylistId = null;
          state.currentPlaylistName = null;
        }
      }
    );
  },
});

export const {
  setCurrentSong, playWithContext, togglePlay, updateCurrentTime, seekToTime, clearSeekTime,
  addToQueue, clearQueue, jumpToQueueItem, playNextSong, playPreviousSong, toggleShuffle, setShuffleMode, cycleRepeat,
  setCurrentPlaylistContext, clearCurrentPlaylistContext,
  adjustLyricsOffset, resetLyricsOffset,
} = playerSlice.actions;
export default playerSlice.reducer;

// ─── Threshold: khi queue còn ít hơn số này thì tự động refill ───────────────
const MIN_QUEUE_SIZE = 5;

/**
 * Refill queue thông minh khi queue < MIN_QUEUE_SIZE.
 * Ưu tiên theo thứ tự:
 *   1. Related songs của bài đang phát (cùng genre/artist)
 *   2. Trending songs làm fallback
 */
export const refillQueueIfNeeded = createAsyncThunk(
  'player/refillQueueIfNeeded',
  async (_, { dispatch, getState }) => {
    const { queue, currentSong } = getState().player;
    if (queue.length >= MIN_QUEUE_SIZE) return;

    const existingIds = new Set([
      ...queue.map(s => s.song_id),
      currentSong?.song_id,
    ].filter(Boolean));

    const needed = MIN_QUEUE_SIZE - queue.length;
    let candidates = [];

    // 1. Thử lấy related songs của bài đang phát
    if (currentSong?.song_id) {
      try {
        const data = await api.get(`/songs/${currentSong.song_id}/related?limit=20`, { silent: true });
        const items = Array.isArray(data) ? data : (data?.items || []);
        const related = items.map(adaptSong).filter(s => !existingIds.has(s.song_id));
        candidates = related;
      } catch {
        // Fallback to trending
      }
    }

    // 2. Nếu related không đủ → bổ sung bằng trending
    if (candidates.length < needed) {
      try {
        const trending = await fetchTrendingSongs(20);
        const extra = trending.filter(s => !existingIds.has(s.song_id) && !candidates.some(c => c.song_id === s.song_id));
        candidates = [...candidates, ...extra];
      } catch {
        // Ignore
      }
    }

    // Shuffle để tránh lặp thứ tự
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    candidates.slice(0, needed).forEach(s => dispatch(addToQueue(s)));
  }
);

/**
 * Play một bài với context, tự động fill queue nếu trống sau khi play.
 * Ưu tiên: bài còn lại trong album -> trending songs.
 * payload: { song, songs?: Song[], keepManualQueue?: boolean }
 */
export const playWithAutoQueue = createAsyncThunk(
  'player/playWithAutoQueue',
  async ({ song, songs = [], keepManualQueue = false }, { dispatch, getState }) => {
    // 1. Play bình thường với context hiện tại
    dispatch(playWithContext({ song, songs, keepManualQueue }));

    // 2. Kiểm tra queue sau khi play
    const queueAfter = getState().player.queue;
    if (queueAfter.length >= MIN_QUEUE_SIZE) return;

    // 3. Queue ít bài — thử fill từ album trước
    if (song.album_id) {
      try {
        const albumSongs = await getAlbumSongs(song.album_id);
        const others = albumSongs.filter(s => s.song_id !== song.song_id);
        if (others.length > 0) {
          dispatch(playWithContext({ song, songs: albumSongs, keepManualQueue }));
          // Sau khi fill từ album, check lại xem có đủ chưa
          const queueNow = getState().player.queue;
          if (queueNow.length >= MIN_QUEUE_SIZE) return;
        }
      } catch {
        // Fallback to trending
      }
    }

    // 4. Vẫn chưa đủ -> fill bằng trending
    await dispatch(refillQueueIfNeeded());
  }
);
