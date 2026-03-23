import { getAuthHeaders } from './AuthService';

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK DATA
// ==========================================
const mockArtists = [
  {
    id: 'A001',
    artist_id: 'A001',
    name: 'Sơn Tùng M-TP',
    monthly_listeners: '5,815,953',
    bio: 'Sơn Tùng M-TP là ca sĩ, nhạc sĩ người Việt Nam nổi tiếng với nhiều hit V-Pop đình đám.',
    photo_url: 'https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1',
    artist_background: 'https://i.scdn.co/image/ab67618600001016c50961b7b7be0034ea366052',
    credits: 'Main Artist • Composer • Studio Producer',
    followers: 2300000,
    isVerified: true,
  },
  {
    id: 'A002',
    artist_id: 'A002',
    name: 'MONO',
    monthly_listeners: '1,234,567',
    bio: 'MONO là nghệ danh của Phúc Du, em trai Sơn Tùng M-TP, nổi tiếng với album "Ngủ Một Mình".',
    photo_url: 'https://i.scdn.co/image/ab6761610000e5eb9d0e2f5b6b668d71231f24e9',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb9d0e2f5b6b668d71231f24e9',
    artist_background: '',
    credits: 'Main Artist • Vocalist',
    followers: 890000,
    isVerified: true,
  },
  {
    id: 'A003',
    artist_id: 'A003',
    name: 'Nguyên Hà',
    monthly_listeners: '456,789',
    bio: 'Nguyên Hà là nữ ca sĩ người Việt Nam với chất giọng ngọt ngào đặc trưng.',
    photo_url: 'https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273a2e0e66e40af40424e05779f',
    artist_background: '',
    credits: 'Main Artist • Vocalist',
    followers: 350000,
    isVerified: false,
  },
  {
    id: 'A004',
    artist_id: 'A004',
    name: 'Đen Vâu',
    monthly_listeners: '2,100,000',
    bio: 'Đen Vâu là rapper nổi tiếng với phong cách bình dị, gần gũi và những ca khúc mang đậm hơi thở đời thường.',
    photo_url: 'https://i.scdn.co/image/ab6761610000e5eb69ca93f21a6abb0c22c2cd8f',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb69ca93f21a6abb0c22c2cd8f',
    artist_background: '',
    credits: 'Main Artist • Rapper • Lyricist',
    followers: 1500000,
    isVerified: true,
  },
  {
    id: 'A005',
    artist_id: 'A005',
    name: 'Mỹ Tâm',
    monthly_listeners: '980,000',
    bio: 'Mỹ Tâm là "Nữ hoàng nhạc pop" Việt Nam với sự nghiệp hơn 20 năm.',
    photo_url: 'https://i.scdn.co/image/ab6761610000e5eb7ab9c9e17a31b2e4cd3fcbba',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb7ab9c9e17a31b2e4cd3fcbba',
    artist_background: '',
    credits: 'Main Artist • Pop Singer',
    followers: 750000,
    isVerified: true,
  },
];

// ==========================================
// API FUNCTIONS
// ==========================================

export const getArtistInfo = async (artistName) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = mockArtists.find(a => a.name === artistName);
        if (found) {
          resolve(found);
        } else {
          resolve({
            name: artistName,
            monthly_listeners: '815,953',
            bio: `${artistName} là nghệ sĩ tài năng với nhiều sản phẩm âm nhạc chất lượng.`,
            photo_url: 'https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1',
            credits: 'Main Artist • Composer • Studio Producer',
          });
        }
      }, 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/artists?name=${encodeURIComponent(artistName)}`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải thông tin nghệ sĩ');
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const getArtistById = async (artistId) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = mockArtists.find(a => a.id === artistId);
        resolve(found || null);
      }, 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/artists/${artistId}`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải thông tin nghệ sĩ');
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const followArtist = async (artistId) => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 400));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/artists/${artistId}/follow`, { method: 'POST', headers });
    if (!response.ok) throw new Error('Lỗi khi theo dõi nghệ sĩ');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getArtists = async () => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockArtists), 300));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/artists`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải danh sách nghệ sĩ');
    return await response.json();
  } catch {
    return mockArtists;
  }
};

export const getFollowedArtists = async () => {
  if (!API_URL) {
    return new Promise((resolve) => setTimeout(() => resolve(mockArtists.slice(0, 4)), 400));
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/artists/followed`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải nghệ sĩ đang theo dõi');
    return await response.json();
  } catch {
    return mockArtists.slice(0, 4);
  }
};

export const searchArtists = (query) => {
  const q = query.toLowerCase().trim();
  return mockArtists.filter((a) => a.name.toLowerCase().includes(q));
};

// [S6-004.1] getArtistStats — thống kê riêng cho nghệ sĩ
export const getArtistStats = async (artistId) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const artist = mockArtists.find((a) => a.id === artistId);
        resolve({
          totalSongs: artist ? Math.floor(Math.random() * 20) + 5 : 0,
          totalPlays: artist ? Math.floor(Math.random() * 500000) + 100000 : 0,
          followers: artist?.followers || 0,
          monthlyListeners: artist?.monthly_listeners || '0',
        });
      }, 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/artists/${artistId}/stats`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải thống kê nghệ sĩ');
    return await response.json();
  } catch (error) {
    return { totalSongs: 0, totalPlays: 0, followers: 0, monthlyListeners: '0' };
  }
};
