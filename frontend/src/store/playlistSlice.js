import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getMyPlaylists,
  createPlaylist as apiCreatePlaylist,
  deletePlaylist as apiDeletePlaylist,
  updatePlaylistName,
  reorderPlaylistSongs,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../services/PlaylistService';
import api from '../services/apiClient';
import { adaptSong, adaptPaginatedResponse } from '../services/adapters';
import { showToast } from './uiSlice';

// ─── Initial State ────────────────────────────────────────────────────────────

export const initialState = {
  entities: {},
  ids: [],
  songs: {},
  cache: { userId: null, lastFetchedAt: null },
  status: 'idle',
  detailStatus: {},
  error: null,
  isReordering: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizePlaylistItem = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id || raw.playlistId || raw.playlist_id;
  if (!id) return null;
  return {
    id,
    name: raw.name || raw.title || '',
    owner: raw.ownerName || raw.owner || 'Bạn',
    userId: raw.userId || raw.user_id || raw.ownerId || null,
    image_url: raw.coverUrl || raw.image_url || null,
    is_public: raw.isPublic ?? raw.is_public ?? false,
    isSystem: !!(raw.isSystem) || raw.type === 'LIKED_SONGS',    type: raw.type || null,
    created_at: raw.createdAt || raw.created_at || null,
    updated_at: raw.updatedAt || raw.updated_at || null,
  };
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchMyPlaylists = createAsyncThunk(
  'playlists/fetchMyPlaylists',
  async (_, { getState, rejectWithValue }) => {
    try {
      const data = await getMyPlaylists({ includeLiked: true });
      const userId = getState().auth.user?.user_id ?? null;
      return { playlists: Array.isArray(data) ? data : [], userId };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch playlists');
    }
  }
);

export const createPlaylist = createAsyncThunk(
  'playlists/createPlaylist',
  async (name, { rejectWithValue }) => {
    try {
      const result = await apiCreatePlaylist({ name });
      if (!result.success || !result.data) return rejectWithValue('Failed to create playlist');
      return result.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create playlist');
    }
  }
);

export const deletePlaylist = createAsyncThunk(
  'playlists/deletePlaylist',
  async (playlistId, { dispatch, getState, rejectWithValue }) => {
    const previousEntities = { ...getState().playlists.entities };
    const previousIds = [...getState().playlists.ids];
    // Optimistic remove
    dispatch(playlistsSlice.actions._optimisticRemove(playlistId));
    try {
      const result = await apiDeletePlaylist(playlistId);
      if (!result.success) throw new Error('Delete failed');
      return playlistId;
    } catch (err) {
      // Revert
      dispatch(playlistsSlice.actions._revertRemove({ entities: previousEntities, ids: previousIds }));
      dispatch(showToast({ message: 'Không thể xoá playlist', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

export const renamePlaylist = createAsyncThunk(
  'playlists/renamePlaylist',
  async ({ playlistId, name }, { dispatch, getState, rejectWithValue }) => {
    const previousName = getState().playlists.entities[playlistId]?.name;
    // Optimistic update
    dispatch(playlistsSlice.actions._optimisticRename({ playlistId, name }));
    try {
      const result = await updatePlaylistName(playlistId, name);
      if (!result.success) throw new Error('Rename failed');
      return { playlistId, name };
    } catch (err) {
      // Revert
      dispatch(playlistsSlice.actions._optimisticRename({ playlistId, name: previousName }));
      dispatch(showToast({ message: 'Không thể đổi tên playlist', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPlaylistSongs = createAsyncThunk(
  'playlists/fetchPlaylistSongs',
  async (playlistId, { rejectWithValue }) => {
    try {
      const data = await api.get(`/playlists/${encodeURIComponent(playlistId)}/songs`);
      const songs = adaptPaginatedResponse(data, adaptSong).filter(Boolean);
      return { playlistId, songs };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch songs');
    }
  }
);

export const addSong = createAsyncThunk(
  'playlists/addSong',
  async ({ playlistId, song }, { dispatch, getState, rejectWithValue }) => {
    const previousSongs = getState().playlists.songs[playlistId] ?? [];
    // Optimistic add
    dispatch(playlistsSlice.actions._optimisticAddSong({ playlistId, song }));
    try {
      const result = await addSongToPlaylist(playlistId, song);
      if (!result.success) throw new Error('Add song failed');
      return { playlistId, song };
    } catch (err) {
      dispatch(playlistsSlice.actions._revertSongs({ playlistId, songs: previousSongs }));
      dispatch(showToast({ message: 'Không thể thêm bài hát', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

export const removeSong = createAsyncThunk(
  'playlists/removeSong',
  async ({ playlistId, songId }, { dispatch, getState, rejectWithValue }) => {
    const previousSongs = getState().playlists.songs[playlistId] ?? [];
    // Optimistic remove
    dispatch(playlistsSlice.actions._optimisticRemoveSong({ playlistId, songId }));
    try {
      const result = await removeSongFromPlaylist(playlistId, songId);
      if (!result.success) throw new Error('Remove song failed');
      return { playlistId, songId };
    } catch (err) {
      dispatch(playlistsSlice.actions._revertSongs({ playlistId, songs: previousSongs }));
      dispatch(showToast({ message: 'Không thể xoá bài hát', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

export const reorderSongs = createAsyncThunk(
  'playlists/reorderSongs',
  async ({ playlistId, newSongs }, { dispatch, getState, rejectWithValue }) => {
    const previousSongs = getState().playlists.songs[playlistId] ?? [];
    const newSongIds = newSongs.map((s) => s.song_id);
    dispatch(reorderSongsOptimistic({ playlistId, newSongs }));
    try {
      const result = await reorderPlaylistSongs(playlistId, newSongIds);
      if (!result.success) throw new Error('Reorder failed');
      dispatch(reorderSongsConfirmed());
      return { playlistId };
    } catch (err) {
      dispatch(reorderSongsReverted({ playlistId, previousSongs }));
      dispatch(showToast({ message: 'Không thể sắp xếp lại bài hát', type: 'error' }));
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState,
  reducers: {
    reorderSongsOptimistic: (state, action) => {
      const { playlistId, newSongs } = action.payload;
      state.songs[playlistId] = newSongs;
      state.isReordering = true;
    },
    reorderSongsConfirmed: (state) => {
      state.isReordering = false;
    },
    reorderSongsReverted: (state, action) => {
      const { playlistId, previousSongs } = action.payload;
      state.songs[playlistId] = previousSongs;
      state.isReordering = false;
    },
    // Internal optimistic helpers
    _optimisticRemove: (state, action) => {
      const id = action.payload;
      state.ids = state.ids.filter((i) => i !== id);
      delete state.entities[id];
    },
    _revertRemove: (state, action) => {
      state.entities = action.payload.entities;
      state.ids = action.payload.ids;
    },
    _optimisticRename: (state, action) => {
      const { playlistId, name } = action.payload;
      if (state.entities[playlistId]) {
        state.entities[playlistId].name = name;
      }
    },
    _optimisticAddSong: (state, action) => {
      const { playlistId, song } = action.payload;
      if (!state.songs[playlistId]) state.songs[playlistId] = [];
      state.songs[playlistId].push(song);
    },
    _optimisticRemoveSong: (state, action) => {
      const { playlistId, songId } = action.payload;
      if (state.songs[playlistId]) {
        state.songs[playlistId] = state.songs[playlistId].filter((s) => s.song_id !== songId);
      }
    },
    _revertSongs: (state, action) => {
      const { playlistId, songs } = action.payload;
      state.songs[playlistId] = songs;
    },
    // Clear currentPlaylistId when deleted playlist was active
    // (handled in playerSlice via extraReducers listening to deletePlaylist.fulfilled)
    clearCurrentPlaylistContext: () => {},
  },
  extraReducers: (builder) => {
    // fetchMyPlaylists
    builder
      .addCase(fetchMyPlaylists.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyPlaylists.fulfilled, (state, action) => {
        const { playlists, userId } = action.payload;
        state.entities = {};
        state.ids = [];
        playlists.forEach((raw) => {
          const normalized = normalizePlaylistItem(raw);
          if (normalized) {
            state.entities[normalized.id] = normalized;
            state.ids.push(normalized.id);
          }
        });
        state.cache.userId = userId;
        state.cache.lastFetchedAt = Date.now();
        state.status = 'succeeded';
      })
      .addCase(fetchMyPlaylists.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch playlists';
      });

    // createPlaylist
    builder
      .addCase(createPlaylist.fulfilled, (state, action) => {
        const normalized = normalizePlaylistItem(action.payload);
        if (normalized) {
          state.entities[normalized.id] = normalized;
          state.ids.push(normalized.id);
        }
      });

    // fetchPlaylistSongs
    builder
      .addCase(fetchPlaylistSongs.pending, (state, action) => {
        const playlistId = action.meta.arg;
        state.detailStatus[playlistId] = 'loading';
      })
      .addCase(fetchPlaylistSongs.fulfilled, (state, action) => {
        const { playlistId, songs } = action.payload;
        state.songs[playlistId] = songs;
        state.detailStatus[playlistId] = 'succeeded';
      })
      .addCase(fetchPlaylistSongs.rejected, (state, action) => {
        const playlistId = action.meta.arg;
        state.detailStatus[playlistId] = 'failed';
      });

    // Listen for logout from authSlice
    builder.addMatcher(
      (action) => action.type === 'auth/logout',
      () => ({ ...initialState })
    );
  },
});

export const {
  reorderSongsOptimistic,
  reorderSongsConfirmed,
  reorderSongsReverted,
} = playlistsSlice.actions;

export default playlistsSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectPlaylistIds = (state) => state.playlists.ids;
export const selectPlaylistById = (state, id) => state.playlists.entities[id];
export const selectAllPlaylists = (state) =>
  state.playlists.ids.map((id) => state.playlists.entities[id]).filter(Boolean);
export const selectPlaylistSongs = (state, id) => state.playlists.songs[id] ?? [];
export const selectPlaylistsStatus = (state) => state.playlists.status;
export const selectIsReordering = (state) => state.playlists.isReordering;
export const selectPlaylistCache = (state) => state.playlists.cache;
export const selectPlaylistCover = (state, id) => {
  const songs = state.playlists.songs[id];
  return songs?.length > 0 ? (songs[0].cover_url ?? songs[0].image_url ?? null) : null;
};
