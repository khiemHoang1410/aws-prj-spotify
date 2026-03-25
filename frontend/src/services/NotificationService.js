import { getAuthHeaders } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL;

// Notification schema:
// { id, type: 'new_song', message, artist_name, song_title, image_url, created_at, is_read }
const mockNotifications = [];

export const getNotifications = async () => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve([...mockNotifications]), 300)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/notifications`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải thông báo');
    return await response.json();
  } catch {
    return [];
  }
};

export const markAsRead = async (notificationId) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => {
        const notif = mockNotifications.find((n) => n.id === notificationId);
        if (notif) notif.is_read = true;
        resolve({ success: true });
      }, 300)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, { method: 'PUT', headers });
    if (!response.ok) throw new Error('Lỗi khi đánh dấu đã đọc');
    return await response.json();
  } catch {
    return { success: false };
  }
};

export const markAllAsRead = async () => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => {
        mockNotifications.forEach((n) => { n.is_read = true; });
        resolve({ success: true });
      }, 300)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/notifications/read-all`, { method: 'PUT', headers });
    if (!response.ok) throw new Error('Lỗi khi đánh dấu tất cả đã đọc');
    return await response.json();
  } catch {
    return { success: false };
  }
};

export const createNotification = async (data) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => {
        const notification = {
          id: 'notif_' + Date.now(),
          type: data.type || 'new_song',
          message: data.message,
          artist_name: data.artist_name,
          song_title: data.song_title,
          image_url: data.image_url || '',
          created_at: new Date().toISOString(),
          is_read: false,
        };
        mockNotifications.unshift(notification);
        resolve({ success: true, data: notification });
      }, 300)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Lỗi khi tạo thông báo');
    return await response.json();
  } catch {
    return { success: false };
  }
};

export const getUnreadCount = () => {
  return mockNotifications.filter((n) => !n.is_read).length;
};
