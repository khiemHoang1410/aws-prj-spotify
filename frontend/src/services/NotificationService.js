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

/**
 * Get human-readable notification message
 */
export const getNotificationMessage = (notification) => {
  if (!notification) return '';
  
  if (notification.entityType === 'ARTIST_REQUEST') {
    const statusText = notification.status === 'approved' ? 'đã được duyệt' : 'đã bị từ chối';
    return `Yêu cầu nghệ sĩ "${notification.stageName}" ${statusText}`;
  }
  
  if (notification.entityType === 'PLAYLIST') {
    return `Danh sách phát "${notification.name}" được tạo mới`;
  }
  
  return 'Có thông báo mới';
};

/**
 * Get route path for notification item
 */
export const getNotificationRoute = (notification) => {
  if (!notification) return '/';
  
  if (notification.entityType === 'ARTIST_REQUEST' && notification.status === 'approved') {
    return `/artist/${notification.userId}`;
  }
  
  if (notification.entityType === 'PLAYLIST') {
    return `/playlist/${notification.id}`;
  }
  
  return '/';
};
