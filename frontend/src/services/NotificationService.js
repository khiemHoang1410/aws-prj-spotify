import api from './apiClient';

export const getNotifications = () => api.get('/notifications');

export const markAsRead = (notificationId) =>
  api.put(`/notifications/${notificationId}/read`);

export const markAllAsRead = () => api.put('/notifications/read-all');

export const createNotification = (payload) =>
  api.post('/notifications', payload);
