import { getAuthHeaders } from "./AuthService";

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK DATA
// ==========================================
const mockUserProfile = {
  user_id: "USER_001",
  id: "USER_001",
  username: "Spotify Lover",
  name: "Spotify Lover",
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
    // Backend chưa có GET /users/{id}, fallback: nếu cùng user hiện tại thì dùng /me.
    const me = await getProfile();
    if (!me) return null;
    if (String(me.id || me.user_id) === String(userId)) return me;
    return {
      ...mockUserProfile,
      id: userId,
      user_id: userId,
    };
  } catch {
    return {
      ...mockUserProfile,
      id: userId,
      user_id: userId,
    };
  }
};

export const getProfile = async () => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockUserProfile), 300));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/me`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải profile');
    const data = await response.json();
    return {
      id: data.id,
      user_id: data.id,
      username: data.displayName || data.email?.split('@')[0] || 'Spotify User',
      name: data.displayName || data.email?.split('@')[0] || 'Spotify User',
      email: data.email,
      avatar_url: data.avatarUrl || null,
      role: data.role || 'user',
    };
  } catch {
    return null;
  }
};

export const updateProfile = async (data) => {
  const payload = {
    displayName: data.displayName || data.name,
    avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : (data.avatar_url !== undefined ? data.avatar_url : undefined),
  };

  if (!payload.displayName && payload.avatarUrl === undefined) {
    return { success: false, message: 'Không có dữ liệu hợp lệ để cập nhật' };
  }

  if (!API_URL) {
    const updated = {
      ...mockUserProfile,
      ...(payload.displayName ? { name: payload.displayName, username: payload.displayName } : {}),
      ...(payload.avatarUrl !== undefined ? { avatar_url: payload.avatarUrl } : {}),
    };
    return new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, data: updated }), 600)
    );
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/me`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Lỗi khi cập nhật profile');
    const updated = await response.json();
    return {
      success: true,
      data: {
        id: updated.id,
        user_id: updated.id,
        username: updated.displayName || updated.email?.split('@')[0] || 'Spotify User',
        name: updated.displayName || updated.email?.split('@')[0] || 'Spotify User',
        email: updated.email,
        avatar_url: updated.avatarUrl || null,
        role: updated.role || 'user',
      },
    };
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
    const response = await fetch(`${API_URL}/me/artist-request`, {
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
