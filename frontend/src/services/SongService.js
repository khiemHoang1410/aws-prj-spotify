import { getAuthHeaders } from "./AuthService";

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK DATA (Dữ liệu giả lập)
// ==========================================
// Dữ liệu giả lập chi tiết bài hát
const mockSongs = [
  { 
    song_id: "S1", 
    title: "Chạy Ngay Đi", 
    artist_name: "Sơn Tùng M-TP", 
    image_url: "/pictures/ChayNgayDi.jpg", 
    duration: 245,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    artist_photo: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
    artist_background: "https://i.scdn.co/image/ab67618600001016c50961b7b7be0034ea366052",
    has_lyrics: true,
    categories: ['vpop', 'pop'],
    play_count: 1250000,
    created_at: '2024-06-15',
    album_id: 'AL001',
    album_name: 'Sky Tour',
  },
  { 
    song_id: "S2", 
    title: "Waiting For You", 
    artist_name: "MONO", 
    image_url: "/pictures/WaitingForYou.jpg", 
    duration: 300,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    video_url: "",
    artist_photo: "https://i.scdn.co/image/ab6761610000e5eb9d0e2f5b6b668d71231f24e9",
    artist_background: "",
    has_lyrics: false,
    categories: ['ballad', 'indie'],
    play_count: 890000,
    created_at: '2024-09-20',
    album_id: 'AL002',
    album_name: 'Ngủ Một Mình',
  },
  {
    song_id: "S3",
    title: "Muộn Rồi Mà Sao Còn",
    artist_name: "Sơn Tùng M-TP",
    image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
    duration: 287,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    video_url: "",
    artist_photo: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
    artist_background: "",
    has_lyrics: false,
    categories: ['vpop', 'ballad'],
    play_count: 2100000,
    created_at: '2023-12-01',
    album_id: 'AL001',
    album_name: 'Sky Tour',
  },
  {
    song_id: "S4",
    title: "Hãy Trao Cho Anh",
    artist_name: "Sơn Tùng M-TP",
    image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
    duration: 255,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    video_url: "",
    artist_photo: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
    artist_background: "",
    has_lyrics: false,
    categories: ['vpop', 'rap'],
    play_count: 1800000,
    created_at: '2023-08-10',
    album_id: 'AL001',
    album_name: 'Sky Tour',
  },
  {
    song_id: "S5",
    title: "Có Chắc Yêu Là Đây",
    artist_name: "Sơn Tùng M-TP",
    image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
    duration: 196,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    video_url: "",
    artist_photo: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
    artist_background: "",
    has_lyrics: false,
    categories: ['vpop', 'pop'],
    play_count: 950000,
    created_at: '2024-03-05',
    album_id: null,
    album_name: null,
  },
  {
    song_id: "S6",
    title: "Nơi Này Có Anh",
    artist_name: "Sơn Tùng M-TP",
    image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
    duration: 314,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    video_url: "",
    artist_photo: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1",
    artist_background: "",
    has_lyrics: false,
    categories: ['vpop', 'ballad'],
    play_count: 1500000,
    created_at: '2023-05-20',
    album_id: null,
    album_name: null,
  },
  {
    song_id: "S7",
    title: "Yêu Được Không",
    artist_name: "MONO",
    image_url: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
    duration: 241,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    video_url: "",
    artist_photo: "https://i.scdn.co/image/ab6761610000e5eb9d0e2f5b6b668d71231f24e9",
    artist_background: "",
    has_lyrics: false,
    categories: ['ballad', 'indie'],
    play_count: 670000,
    created_at: '2025-01-15',
    album_id: 'AL002',
    album_name: 'Ngủ Một Mình',
  },
  {
    song_id: "S8",
    title: "Tôi Thấy Hoa Vàng Trên Cỏ Xanh",
    artist_name: "Nguyên Hà",
    image_url: "https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f",
    duration: 278,
    audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    video_url: "",
    artist_photo: "https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f",
    artist_background: "",
    has_lyrics: false,
    categories: ['ballad', 'indie'],
    play_count: 420000,
    created_at: '2024-11-28',
    album_id: null,
    album_name: null,
  },
];

const mockPlaylists = [
  {
    id: "PL001",
    name: "Nhạc Việt Hot",
    owner: "Spotify",
    image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052",
    songIds: ["S1", "S3", "S4", "S5", "S6"],
  },
  {
    id: "PL002",
    name: "Chill Buổi Sáng",
    owner: "Spotify",
    image_url: "https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e",
    songIds: ["S2", "S7", "S8"],
  },
  {
    id: "PL003",
    name: "Top Hits 2025",
    owner: "Bạn",
    image_url: "https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f",
    songIds: ["S1", "S2", "S3"],
  },
];

const mockCategories = [
  { id: "CAT001", name: "Pop", color: "bg-pink-600", image_url: "" },
  { id: "CAT002", name: "V-Pop", color: "bg-purple-600", image_url: "" },
  { id: "CAT003", name: "R&B", color: "bg-blue-600", image_url: "" },
  { id: "CAT004", name: "Ballad", color: "bg-green-600", image_url: "" },
  { id: "CAT005", name: "EDM", color: "bg-yellow-500", image_url: "" },
  { id: "CAT006", name: "Hip-hop", color: "bg-red-600", image_url: "" },
];

const mockLyricsDatabase = {
  "S1": [
    { time: 0, text: "🎵 (Nhạc dạo) 🎵" },
    { time: 10, text: "Đã có lúc anh mong tim mình bé lại" },
    { time: 14, text: "Để nỗi nhớ em không thể nào thêm nữa" },
    { time: 18, text: "Đã có lúc anh mong ngừng thời gian trôi" },
    { time: 22, text: "Để những dấu yêu sẽ không phai mờ..." },
    { time: 26, text: "Nếu không hát lên nặng lòng da diết" },
    { time: 30, text: "Nếu không nói ra làm sao biết" },
    { time: 34, text: "Anh thương em, anh yêu em tha thiết!" },
    { time: 38, text: "Chạy ngay đi, trước khi..." },
    { time: 42, text: "Mọi điều tồi tệ hơn!" },
    { time: 50, text: "🎶🎶🎶" },
  ]
};

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
    return Array.isArray(data) ? data : (data.data ?? []);
  } catch (error) {
    console.error(error);
    return []; // Trả về mảng rỗng nếu lỗi để UI không bị crash
  }
};

export const getSongById = async (songId) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockSongs.find((s) => s.song_id === songId) || null);
      }, 300);
    });
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) throw new Error('Lỗi khi tải chi tiết bài hát');
    return await response.json();
  } catch {
    return null;
  }
};

// Hàm mới: Lấy lời bài hát đồng bộ
export const getLyrics = async (songId) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockLyricsDatabase[songId] || []), 200);
  });
};

export const getPlaylists = async () => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockPlaylists), 400));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/playlists`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải playlists');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data ?? []);
  } catch (error) {
    return mockPlaylists;
  }
};

export const getCategories = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(mockCategories), 300));
};

export const reportSong = async (songId, reason, description = '') => {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, songId, reason, description }), 500));
};

export const getPlaylistById = async (id) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const playlist = mockPlaylists.find((p) => p.id === id);
        if (!playlist) return resolve(null);
        const songs = mockSongs.filter((s) => playlist.songIds.includes(s.song_id));
        resolve({ ...playlist, songs });
      }, 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/playlists/${id}`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải playlist');
    const data = await response.json();
    return data.data ?? data;
  } catch {
    return null;
  }
};

export const createPlaylist = async (data) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPlaylist = {
          id: `PL${Date.now()}`,
          name: data.name || 'Playlist mới',
          owner: data.owner || 'Bạn',
          image_url: data.image_url || 'https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052',
          songIds: [],
        };
        mockPlaylists.push(newPlaylist);
        resolve({ success: true, data: newPlaylist });
      }, 400);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/playlists`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Lỗi khi tạo playlist');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deletePlaylist = async (id) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = mockPlaylists.findIndex((p) => p.id === id);
        if (idx !== -1) mockPlaylists.splice(idx, 1);
        resolve({ success: true });
      }, 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/playlists/${id}`, { method: 'DELETE', headers });
    if (!response.ok) throw new Error('Lỗi khi xoá playlist');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getMyPlaylists = async () => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockPlaylists.filter((p) => p.owner === 'Bạn')), 300);
    });
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/playlists/me`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải playlist của tôi');
    return await response.json();
  } catch {
    return [];
  }
};

export const getTopSongs = async () => getSongs();

export const searchSongs = (query) => {
  const q = query.toLowerCase().trim();
  return mockSongs.filter(
    (s) => s.title.toLowerCase().includes(q) || s.artist_name.toLowerCase().includes(q)
  );
};

export const getSongsByCategory = (categoryId) =>
  mockSongs.filter((s) => s.categories?.includes(categoryId));

export const searchWithRelevance = (query) => {
  if (!query || query.trim().length === 0) return { songs: [], matchedCategories: [] };
  const q = query.toLowerCase().trim();
  const maxPlayCount = Math.max(...mockSongs.map((s) => s.play_count || 0), 1);

  const scored = mockSongs.map((song) => {
    let score = 0;
    const titleLower = song.title.toLowerCase();
    const artistLower = song.artist_name.toLowerCase();

    if (titleLower === q) score += 100;
    else if (titleLower.startsWith(q)) score += 80;
    else if (titleLower.includes(q)) score += 60;

    if (artistLower === q) score += 90;
    else if (artistLower.startsWith(q)) score += 70;
    else if (artistLower.includes(q)) score += 50;

    if (song.categories?.some((c) => c.includes(q))) score += 30;

    if (score > 0) {
      score += Math.round(((song.play_count || 0) / maxPlayCount) * 10);
    }

    return { ...song, _score: score };
  });

  const matched = scored.filter((s) => s._score > 0).sort((a, b) => b._score - a._score);
  const categoriesSet = new Set();
  matched.forEach((s) => s.categories?.forEach((c) => categoriesSet.add(c)));

  return { songs: matched, matchedCategories: [...categoriesSet] };
};

// [S6-001.1] removeSongFromPlaylist
export const removeSongFromPlaylist = async (playlistId, songId) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const playlist = mockPlaylists.find((p) => p.id === playlistId);
        if (playlist) {
          const idx = playlist.songIds.indexOf(songId);
          if (idx !== -1) playlist.songIds.splice(idx, 1);
        }
        resolve({ success: true });
      }, 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE', headers });
    if (!response.ok) throw new Error('Lỗi khi xoá bài hát');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const addSongToPlaylist = async (playlistId, song) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const playlist = mockPlaylists.find((p) => p.id === playlistId);
        if (playlist && !playlist.songIds.includes(song.song_id)) {
          playlist.songIds.push(song.song_id);
        }
        resolve({ success: true });
      }, 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const songId = song?.song_id || song?.id || song;
    const response = await fetch(`${API_URL}/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ songId }),
    });
    if (!response.ok) throw new Error('Lỗi khi thêm bài hát');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// [S8-005.1] updateSong — sửa thông tin bài hát
export const updateSong = async (songId, data) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const song = mockSongs.find((s) => s.song_id === songId);
        if (song) {
          Object.assign(song, data);
          resolve({ success: true, data: song });
        } else {
          resolve({ success: false, message: 'Không tìm thấy bài hát' });
        }
      }, 500);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Lỗi khi cập nhật bài hát');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// [S8-005.1] deleteSong — xoá bài hát
export const deleteSong = async (songId) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = mockSongs.findIndex((s) => s.song_id === songId);
        if (idx !== -1) {
          mockSongs.splice(idx, 1);
          resolve({ success: true });
        } else {
          resolve({ success: false, message: 'Không tìm thấy bài hát' });
        }
      }, 500);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/songs/${encodeURIComponent(songId)}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Lỗi khi xoá bài hát');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};