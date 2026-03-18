import { getAuthHeaders } from "./AuthService";

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK DATA
// ==========================================
const mockUserProfile = {
  user_id: "USER_001",
  username: "Spotify Lover",
  email: "studygroup@gmail.com",
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
    console.error(error);
    return null;
  }
};