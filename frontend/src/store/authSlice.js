import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  isModalOpen: false,
  modalType: 'login', // 'login' hoặc 'register'
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Xử lý Modal
    openModal: (state, action) => {
      state.isModalOpen = true;
      state.modalType = action.payload || 'login';
    },
    closeModal: (state) => {
      state.isModalOpen = false;
    },
    // Xử lý User
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.isModalOpen = false; // Đăng nhập xong thì tự đóng modal
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

export const { openModal, closeModal, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;