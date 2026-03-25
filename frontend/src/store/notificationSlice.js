import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isDropdownOpen: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.is_read).length;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif && !notif.is_read) {
        notif.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => { n.is_read = true; });
      state.unreadCount = 0;
    },
    toggleNotificationDropdown: (state) => {
      state.isDropdownOpen = !state.isDropdownOpen;
    },
    closeNotificationDropdown: (state) => {
      state.isDropdownOpen = false;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markRead,
  markAllRead,
  toggleNotificationDropdown,
  closeNotificationDropdown,
} = notificationSlice.actions;
export default notificationSlice.reducer;
