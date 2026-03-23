import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    currentView: 'home',
    previousView: 'home',
    searchQuery: '',
    isBrowsing: false,
    isSearchSubmitted: false,
    isRightSidebarOpen: false,
    isPiP: false,
    toast: { message: '', type: 'info', visible: false },
    isReportModalOpen: false,
    reportTargetSong: null,
    activePlaylistId: null,
    activeArtistId: null,
    activeCategoryId: null,
    activeCategoryName: '',
  },
  reducers: {
    setView: (state, action) => {
      state.previousView = state.currentView;
      state.currentView = action.payload;
      if (action.payload !== 'search') {
        state.searchQuery = '';
        state.isBrowsing = false;
        state.isSearchSubmitted = false;
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.isSearchSubmitted = false;
      if (action.payload.length > 0) {
        state.isBrowsing = false;
      }
    },
    toggleBrowse: (state) => {
      state.isBrowsing = true;
      state.searchQuery = '';
      state.isSearchSubmitted = false;
    },
    submitSearch: (state) => {
      state.isSearchSubmitted = true;
      state.isBrowsing = false;
    },
    toggleRightSidebar: (state) => {
      state.isRightSidebarOpen = !state.isRightSidebarOpen;
    },
    setPiP: (state, action) => {
      state.isPiP = action.payload;
    },
    showToast: (state, action) => {
      state.toast = { message: action.payload.message, type: action.payload.type || 'info', visible: true };
    },
    hideToast: (state) => {
      state.toast.visible = false;
    },
    openReportModal: (state, action) => {
      state.isReportModalOpen = true;
      state.reportTargetSong = action.payload;
    },
    closeReportModal: (state) => {
      state.isReportModalOpen = false;
      state.reportTargetSong = null;
    },
    setActivePlaylist: (state, action) => {
      state.activePlaylistId = action.payload;
    },
    setActiveArtist: (state, action) => {
      state.activeArtistId = action.payload;
    },
    setActiveCategory: (state, action) => {
      state.activeCategoryId = action.payload.id;
      state.activeCategoryName = action.payload.name;
    },
  },
});

export const {
  setView, setSearchQuery, toggleBrowse, submitSearch, toggleRightSidebar,
  setPiP, showToast, hideToast, openReportModal, closeReportModal,
  setActivePlaylist, setActiveArtist, setActiveCategory,
} = uiSlice.actions;
export default uiSlice.reducer;