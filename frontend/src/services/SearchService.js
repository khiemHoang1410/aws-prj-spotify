import api from './apiClient';
import { adaptSong, adaptArtist, adaptAlbum } from './adapters';

export const search = async (query, type = 'all') => {
  const q = (query || '').trim();
  if (!q) return { songs: [], artists: [], albums: [] };

  try {
    const data = await api.get(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);

    // Adapt và giữ lại _score từ OpenSearch để sort đúng thứ tự relevance
    const adaptWithScore = (item, adaptFn) => {
      const adapted = adaptFn(item);
      if (adapted && item._score != null) adapted._score = item._score;
      return adapted;
    };

    const sortByScore = (arr) =>
      [...arr].sort((a, b) => (b._score ?? 0) - (a._score ?? 0));

    return {
      songs:   sortByScore((Array.isArray(data?.songs)   ? data.songs   : []).map(s => adaptWithScore(s, adaptSong))),
      artists: sortByScore((Array.isArray(data?.artists) ? data.artists : []).map(a => adaptWithScore(a, adaptArtist))),
      albums:  sortByScore((Array.isArray(data?.albums)  ? data.albums  : []).map(a => adaptWithScore(a, adaptAlbum))),
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
