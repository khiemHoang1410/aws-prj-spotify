import api from './apiClient';

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const getNotifications = async () => {
  try {
    const data = await api.get('/notifications');
    return normalizeList(data);
  } catch {
    return [];
  }
};

export const markAsRead = async (notificationId) => {
  try {
    return await api.put(`/notifications/${notificationId}/read`);
  } catch {
    return { success: false };
  }
};

export const markAllAsRead = async () => {
  try {
    return await api.put('/notifications/read-all');
  } catch {
    return { success: false };
  }
};

export const createNotification = async (payload) => {
  try {
    return await api.post('/notifications', payload);
  } catch {
    return { success: false };
  }
};
