import api from './apiClient';
import { adaptSong, adaptArtist, adaptAlbum } from './adapters';

export const search = async (query, type = 'all') => {
  const q = (query || '').trim();
  if (!q) return { songs: [], artists: [], albums: [] };

  try {
    const data = await api.get(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);

    // OpenSearch đã rank đúng theo relevance score + playCount
    // Không filter lại ở FE để tránh loại bỏ kết quả match theo artistName
    return {
      songs:   (Array.isArray(data?.songs)   ? data.songs   : []).map(adaptSong),
      artists: (Array.isArray(data?.artists) ? data.artists : []).map(adaptArtist),
      albums:  (Array.isArray(data?.albums)  ? data.albums  : []).map(adaptAlbum),
    };
  } catch (error) {
    console.error('Search error:', error);
    return { songs: [], artists: [], albums: [] };
  }
};

export const searchSongs = async (query) => {
  const data = await search(query, 'song');
  return data.songs || [];
};

export const searchArtists = async (query) => {
  const data = await search(query, 'artist');
  return data.artists || [];
};

export const searchAlbums = async (query) => {
  const data = await search(query, 'album');
  return data.albums || [];
};
