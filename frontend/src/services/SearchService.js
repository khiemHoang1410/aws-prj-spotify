import api from './apiClient';

export const search = async (query, type = 'all') => {
  const q = (query || '').trim();
  if (!q) return { songs: [], artists: [], albums: [] };

  try {
    return await api.get(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);
  } catch {
    return { songs: [], artists: [], albums: [] };
  }
};

export const searchSongs = async (query) => {
  const data = await search(query, 'song');
  if (Array.isArray(data)) return data;
  return data.songs || data.items || [];
};

export const searchArtists = async (query) => {
  const data = await search(query, 'artist');
  if (Array.isArray(data)) return data;
  return data.artists || data.items || [];
};

export const searchAlbums = async (query) => {
  const data = await search(query, 'album');
  if (Array.isArray(data)) return data;
  return data.albums || data.items || [];
};
