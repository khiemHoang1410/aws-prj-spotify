import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  isModalOpen: false,
  modalType: 'login', 
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
    },
  },
});

export const { openModal, closeModal, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;