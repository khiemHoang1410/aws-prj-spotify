import { getAuthHeaders } from './AuthService';
import { getSongs } from './SongService';

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// MOCK DATA
// ==========================================
const mockAlbums = [
  {
    id: 'AL001',
    title: 'Sky Tour',
    artist_id: 'A001',
    artist_name: 'Sơn Tùng M-TP',
    image_url: 'https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052',
    release_date: '2023-08-10',
    songIds: ['S1', 'S3', 'S4'],
  },
  {
    id: 'AL002',
    title: 'Ngủ Một Mình',
    artist_id: 'A002',
    artist_name: 'MONO',
    image_url: 'https://i.scdn.co/image/ab67616d0000b27361421c970b552bb73238618e',
    release_date: '2024-09-20',
    songIds: ['S2', 'S7'],
  },
];

// ==========================================
// [S8-006.3] READ FUNCTIONS
// ==========================================
export const getAlbumsByArtist = async (artistName) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockAlbums.filter((a) => a.artist_name === artistName));
      }, 300);
    });
  }

  try {
    const albums = await getAllAlbums();
    const artistLower = artistName.toLowerCase();
    return albums.filter((album) => {
      const byName = album.artist_name?.toLowerCase() === artistLower;
      return byName;
    });
  } catch {
    return [];
  }
};

export const getAlbumById = async (albumId) => {
  if (!API_URL) {
    return new Promise(async (resolve) => {
      setTimeout(async () => {
        const album = mockAlbums.find((a) => a.id === albumId);
        if (!album) { resolve(null); return; }
        const allSongs = await getSongs();
        const songs = allSongs.filter((s) => album.songIds.includes(s.song_id));
        resolve({ ...album, songs });
      }, 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}`, { headers });
    if (!response.ok) throw new Error('Lỗi khi tải album');
    return await response.json();
  } catch (error) {
    return null;
  }
};

export const getAllAlbums = async () => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockAlbums]), 300);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/albums`, { headers });
    if (!response.ok) throw new Error('Lỗi khi tải albums');
    return await response.json();
  } catch (error) {
    return [];
  }
};

export const getAlbumSongs = async (albumId) => {
  if (!API_URL) {
    return new Promise(async (resolve) => {
      setTimeout(async () => {
        const album = mockAlbums.find((a) => a.id === albumId);
        if (!album) {
          resolve([]);
          return;
        }
        const allSongs = await getSongs();
        resolve(allSongs.filter((s) => album.songIds.includes(s.song_id)));
      }, 300);
    });
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}/songs`, { method: 'GET', headers });
    if (!response.ok) throw new Error('Lỗi khi tải bài hát album');
    return await response.json();
  } catch {
    return [];
  }
};

// ==========================================
// [S8-006.4] CUD FUNCTIONS
// ==========================================
export const createAlbum = async (data) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAlbum = {
          id: `AL${String(mockAlbums.length + 1).padStart(3, '0')}`,
          songIds: [],
          ...data,
        };
        mockAlbums.push(newAlbum);
        resolve({ success: true, data: newAlbum });
      }, 500);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/albums`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Lỗi khi tạo album');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateAlbum = async (albumId, data) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const album = mockAlbums.find((a) => a.id === albumId);
        if (album) {
          Object.assign(album, data);
          resolve({ success: true, data: album });
        } else {
          resolve({ success: false, message: 'Không tìm thấy album' });
        }
      }, 500);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Lỗi khi cập nhật album');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteAlbum = async (albumId) => {
  if (!API_URL) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = mockAlbums.findIndex((a) => a.id === albumId);
        if (idx !== -1) {
          mockAlbums.splice(idx, 1);
          resolve({ success: true });
        } else {
          resolve({ success: false, message: 'Không tìm thấy album' });
        }
      }, 500);
    });
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/albums/${encodeURIComponent(albumId)}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Lỗi khi xoá album');
    return await response.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// [S8-006.5] SONG MANAGEMENT
// ==========================================
export const addSongToAlbum = async (albumId, songId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const album = mockAlbums.find((a) => a.id === albumId);
      if (album && !album.songIds.includes(songId)) {
        album.songIds.push(songId);
      }
      resolve({ success: true });
    }, 300);
  });
};

export const removeSongFromAlbum = async (albumId, songId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const album = mockAlbums.find((a) => a.id === albumId);
      if (album) {
        const idx = album.songIds.indexOf(songId);
        if (idx !== -1) album.songIds.splice(idx, 1);
      }
      resolve({ success: true });
    }, 300);
  });
};
