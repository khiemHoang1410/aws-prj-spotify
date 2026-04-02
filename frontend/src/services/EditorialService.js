import api from './apiClient';

export const listPublished = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    const query = queryParams.toString();
    return await api.get(`/editorial-playlists${query ? `?${query}` : ''}`);
  } catch {
    return { items: [], nextCursor: null };
  }
};

export const getPlaylist = async (id, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    const query = queryParams.toString();
    return await api.get(`/editorial-playlists/${id}${query ? `?${query}` : ''}`);
  } catch {
    return null;
  }
};
