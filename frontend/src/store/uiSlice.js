import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    currentView: 'home', 
    searchQuery: '',
    isBrowsing: false,
    isSearchSubmitted: false, // <-- Thêm state này để quản lý DropDown vs Toàn trang
  },
  reducers: {
    setView: (state, action) => {
      state.currentView = action.payload;
      if (action.payload !== 'search') {
         state.searchQuery = '';
         state.isBrowsing = false;
         state.isSearchSubmitted = false;
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.isSearchSubmitted = false; // Khi user tiếp tục gõ, ẩn toàn trang đi, quay lại DropDown
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
      state.isSearchSubmitted = true; // Kích hoạt hiển thị màn hình SearchResults
      state.isBrowsing = false;
    }
  },
});

export const { setView, setSearchQuery, toggleBrowse, submitSearch } = uiSlice.actions;
export default uiSlice.reducer;