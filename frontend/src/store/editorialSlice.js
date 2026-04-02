import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as EditorialService from '../services/EditorialService';

export const fetchFeaturedPlaylists = createAsyncThunk(
  'editorial/fetchFeaturedPlaylists',
  async () => {
    const result = await EditorialService.listPublished({ limit: 20 });
    return result.items ?? [];
  }
);

const editorialSlice = createSlice({
  name: 'editorial',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeaturedPlaylists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedPlaylists.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFeaturedPlaylists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch featured playlists';
      });
  },
});

export const selectFeaturedPlaylists = (state) => state.editorial.items;
export const selectFeaturedLoading = (state) => state.editorial.loading;
export const selectFeaturedError = (state) => state.editorial.error;

export default editorialSlice.reducer;
