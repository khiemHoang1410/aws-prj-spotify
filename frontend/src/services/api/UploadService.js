import { getAuthHeaders } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL;

export const uploadSong = async (formData) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, data: { id: `SONG_${Date.now()}`, ...formData } }), 2000)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/songs/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error('Lỗi khi upload bài hát');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const uploadCoverImage = async (file) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, data: { url: 'mock://cover.jpg' } }), 1000)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const body = new FormData();
    body.append('cover', file);
    const response = await fetch(`${API_URL}/songs/upload-cover`, {
      method: 'POST',
      headers: { Authorization: headers.Authorization },
      body,
    });
    if (!response.ok) throw new Error('Lỗi khi upload ảnh bìa');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const uploadMV = async (file) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, data: { url: 'mock://mv.mp4' } }), 3000)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const body = new FormData();
    body.append('mv', file);
    const response = await fetch(`${API_URL}/songs/upload-mv`, {
      method: 'POST',
      headers: { Authorization: headers.Authorization },
      body,
    });
    if (!response.ok) throw new Error('Lỗi khi upload MV');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};
