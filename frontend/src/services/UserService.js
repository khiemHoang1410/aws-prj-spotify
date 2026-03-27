import { getAuthHeaders } from "./AuthService";
import { adaptUser } from "./adapters";

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK DATA
// ==========================================
const mockUserProfile = {
  user_id: "USER_001",
  username: "Spotify Lover",
  email: "user@test.com",
  avatar_url: "https://i.pravatar.cc/150?img=11"
};



// ==========================================
// API FUNCTIONS
// ==========================================

export const getUserProfile = async (userId) => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockUserProfile), 300));
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) throw new Error("Lỗi khi tải thông tin user");
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const getProfile = async () => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockUserProfile), 300));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/users/me`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải profile');
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const updateProfile = async (data) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, data: { ...mockUserProfile, ...data } }), 600)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Lỗi khi cập nhật profile');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const requestArtistVerify = async (formData) => {
  if (!API_URL) {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, message: 'Yêu cầu đã được gửi' }), 1000)
    );
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/users/artist-verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error('Lỗi khi gửi yêu cầu xác minh');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getPlayHistory = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { song_id: "H1", title: "Muộn Rồi Mà Sao Còn", artist_name: "Sơn Tùng M-TP", image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052" },
        { song_id: "H2", title: "Em Của Ngày Hôm Qua", artist_name: "Sơn Tùng M-TP", image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052" }
      ]);
    }, 300);
  });
};
