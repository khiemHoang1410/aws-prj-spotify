const API_URL = import.meta.env.VITE_API_URL;

const parseResponse = async (response, fallbackMessage) => {
  if (response.ok) return response.json();

  let message = fallbackMessage;
  try {
    const data = await response.json();
    message = data.error || data.message || fallbackMessage;
  } catch {
    // no-op
  }
  throw new Error(message);
};

export const search = async (query, type = 'all') => {
  const q = (query || '').trim();
  if (!q) return { songs: [], artists: [], albums: [] };

  if (!API_URL) {
    return { songs: [], artists: [], albums: [] };
  }

  try {
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await parseResponse(response, 'Lỗi khi tìm kiếm');
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
