import { getAuthHeaders } from "./AuthService";

const API_URL = import.meta.env.VITE_API_URL;

export const getNotifications = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/notifications`, { headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: "PUT", headers,
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: false };
  }
};

export const markAllAsRead = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/notifications/read-all`, { method: "PUT", headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: false };
  }
};

export const createNotification = async (data) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/notifications`, {
      method: "POST", headers, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { success: false };
  }
};
