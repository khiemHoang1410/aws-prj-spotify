import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    // Search state (vẫn cần vì search UX phức tạp hơn URL đơn thuần)
    searchQuery: '',
    isBrowsing: false,
    isSearchSubmitted: false,

    // Layout
    isRightSidebarOpen: false,
    isPiP: false,

    // Toast
    toast: { message: '', type: 'info', visible: false },

    // Report modal
    isReportModalOpen: false,
    reportTargetSong: null,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.isSearchSubmitted = false;
      if (action.payload.length > 0) state.isBrowsing = false;
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
    clearSearch: (state) => {
      state.searchQuery = '';
      state.isBrowsing = false;
      state.isSearchSubmitted = false;
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
  },
});

export const {
  setSearchQuery, toggleBrowse, submitSearch, clearSearch,
  toggleRightSidebar, setPiP,
  showToast, hideToast,
  openReportModal, closeReportModal,
} = uiSlice.actions;
export default uiSlice.reducer;
