import { getAuthHeaders } from "./AuthService";
import { adaptArtist, adaptPaginatedResponse } from "./adapters";

const API_URL = import.meta.env.VITE_API_URL;

export const getArtistById = async (artistId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/artists/${artistId}`, { headers });
    if (!res.ok) throw new Error();
    return adaptArtist(await res.json());
  } catch {
    return null;
  }
};

export const getArtistInfo = async (artistName) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/artists?name=${encodeURIComponent(artistName)}`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return adaptPaginatedResponse(data, adaptArtist)[0] || null;
  } catch {
    return null;
  }
};

export const getArtists = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/artists`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return adaptPaginatedResponse(data, adaptArtist);
  } catch {
    return [];
  }
};

export const getArtistByUserId = async (userId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/artists?userId=${encodeURIComponent(userId)}`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    // BE trả về single item hoặc array
    if (Array.isArray(data)) return data[0] ? adaptArtist(data[0]) : null;
    if (data?.items) return data.items[0] ? adaptArtist(data.items[0]) : null;
    return data ? adaptArtist(data) : null;
  } catch {
    return null;
  }
};

export const followArtist = async (artistId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/artists/${artistId}/follow`, { method: "POST", headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
};

export const getFollowedArtists = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/artists/followed`, { headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
};

export const getArtistStats = async (artistId) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/artists/${artistId}/stats`, { headers });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { totalSongs: 0, totalPlays: 0, followers: 0, monthlyListeners: "0" };
  }
};

export const searchArtists = async (query) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}&type=artist`, { headers });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return (data.artists || []).map(adaptArtist);
  } catch {
    return [];
  }
};
