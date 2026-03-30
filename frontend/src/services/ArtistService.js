import api from './apiClient';
import { adaptArtist, adaptPaginatedResponse } from './adapters';

export const getArtists = async () => {
  const data = await api.get('/artists');
  return adaptPaginatedResponse(data, adaptArtist);
};

export const getArtistById = async (artistId) => {
  const data = await api.get(`/artists/${artistId}`);
  return adaptArtist(data);
};

export const getArtistInfo = async (artistName) => {
  const data = await api.get(`/artists?name=${encodeURIComponent(artistName)}`);
  return adaptPaginatedResponse(data, adaptArtist)[0] ?? null;
};

export const getArtistByUserId = async (userId) => {
  const data = await api.get(`/artists?userId=${encodeURIComponent(userId)}`);
  if (Array.isArray(data)) return data[0] ? adaptArtist(data[0]) : null;
  if (data?.items) return data.items[0] ? adaptArtist(data.items[0]) : null;
  return data ? adaptArtist(data) : null;
};

export const getArtistStats = async (artistId) => {
  return api.get(`/artists/${artistId}/stats`);
};

export const followArtist = async (artistId) => {
  return api.post(`/artists/${artistId}/follow`);
};

export const getFollowedArtists = async () => {
  return api.get('/artists/followed');
};

export const searchArtists = async (query) => {
  const data = await api.get(`/search?q=${encodeURIComponent(query)}&type=artist`);
  return (data?.artists || []).map(adaptArtist);
};
