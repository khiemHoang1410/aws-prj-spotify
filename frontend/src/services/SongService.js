import { getAuthHeaders } from "./AuthService";

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK DATA (Dữ liệu giả lập)
// ==========================================
const mockSongs = [
  {
    song_id: "SONG_001",
    title: "Chạy Ngay Đi",
    artist_name: "Sơn Tùng M-TP",
    duration: 245, // Tính bằng giây
    image_url: "../../public/pictures/ChayNgayDi.jpg", // Đường dẫn ảnh test
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Link nhạc test open source
  },
  {
    song_id: "SONG_002",
    title: "Waiting For You",
    artist_name: "MONO",
    duration: 195,
    image_url: "../../public/pictures/WaitingForYou.jpg",
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  }
];

// ==========================================
// API FUNCTIONS
// ==========================================

export const getSongs = async () => {
  // 1. NẾU CHƯA CÓ API THẬT: Trả về Mock Data sau 0.5 giây (Giả lập delay mạng)
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSongs), 500);
    });
  }

  // 2. NẾU CÓ API THẬT: Gọi lên AWS API Gateway
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/songs`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) throw new Error("Lỗi khi tải danh sách bài hát");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return []; // Trả về mảng rỗng nếu lỗi để UI không bị crash
  }
};