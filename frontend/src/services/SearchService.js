import api from './apiClient';

/**
 * Fuzzy matching helper - tìm độ tương đồng giữa 2 string
 * Returns score từ 0-1 (1 = match hoàn hảo)
 */
const fuzzyMatch = (query, text) => {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  
  // Exact match - highest priority
  if (t === q) return 1;
  if (t.includes(q)) return 0.9;
  
  // Levenshtein distance (simplified)
  let matches = 0;
  for (let i = 0; i < q.length; i++) {
    if (t.includes(q[i])) matches++;
  }
  return matches / Math.max(q.length, t.length);
};

/**
 * Sort results by fuzzy match relevance
 */
const fuzzySort = (query, items, fieldName = 'name') => {
  return items
    .map(item => ({
      ...item,
      _relevance: fuzzyMatch(query, item[fieldName] || ''),
    }))
    .filter(item => item._relevance > 0.3) // Filter out very poor matches
    .sort((a, b) => b._relevance - a._relevance)
    .map(({ _relevance, ...item }) => item);
};

export const search = async (query, type = 'all') => {
  const q = (query || '').trim();
  if (!q) return { songs: [], artists: [], albums: [] };

  try {
    const data = await api.get(`/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);
    
    // Ensure response format is consistent
    const response = {
      songs: Array.isArray(data?.songs) ? data.songs : [],
      artists: Array.isArray(data?.artists) ? data.artists : [],
      albums: Array.isArray(data?.albums) ? data.albums : [],
    };

    // Apply fuzzy sorting untuk typo tolerance
    return {
      songs: fuzzySort(q, response.songs, 'title'),
      artists: fuzzySort(q, response.artists, 'name'),
      albums: fuzzySort(q, response.albums, 'title'),
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
