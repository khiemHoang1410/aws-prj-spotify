/**
 * RecommendationService — Lấy dữ liệu đề xuất từ API backend.
 * Client-side algorithms chỉ dùng làm fallback khi API không khả dụng.
 */
import api from './apiClient';
import { adaptSong } from './adapters';

// ─── API-based (primary) ──────────────────────────────────────────────────────

export const fetchTrendingSongs = async (limit = 10) => {
  try {
    const data = await api.get(`/songs/trending?limit=${Math.min(limit, 50)}`, { silent: true });
    const items = Array.isArray(data) ? data : (data?.items || []);
    return items.map(adaptSong);
  } catch {
    return [];
  }
};

export const fetchNewReleases = async (limit = 10) => {
  try {
    const data = await api.get(`/songs/new-releases?limit=${Math.min(limit, 50)}`, { silent: true });
    const items = Array.isArray(data) ? data : (data?.items || []);
    return items.map(adaptSong);
  } catch {
    return [];
  }
};

// ─── Client-side fallback (dùng khi đã có allSongs từ cache) ─────────────────

export const getPersonalizedSongs = (likedSongs, allSongs) => {
  if (!likedSongs || likedSongs.length === 0) return [];
  if (!allSongs || allSongs.length === 0) return [];

  const likedArtists = new Set(likedSongs.map((s) => s.artist_name));
  const likedCategories = new Set(likedSongs.flatMap((s) => s.categories || []));
  const maxPlayCount = Math.max(...allSongs.map((s) => s.play_count || 0), 1);

  const scored = allSongs.map((song) => {
    let score = 0;
    if (likedArtists.has(song.artist_name)) score += 3;
    (song.categories || []).forEach((cat) => {
      if (likedCategories.has(cat)) score += 2;
    });
    score += (song.play_count || 0) / maxPlayCount;
    return { ...song, _score: score };
  });

  return scored.sort((a, b) => b._score - a._score).slice(0, 10);
};

/** @deprecated Dùng fetchTrendingSongs() thay thế */
export const getTrendingSongs = (allSongs) => {
  return [...allSongs].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 10);
};

/** @deprecated Dùng fetchNewReleases() thay thế */
export const getNewReleases = (allSongs) => {
  return [...allSongs]
    .sort((a, b) => new Date(b.created_at || '2020-01-01') - new Date(a.created_at || '2020-01-01'))
    .slice(0, 10);
};

export const getDiscoverMix = (_likedSongs, allSongs) => {
  if (!allSongs || allSongs.length === 0) return [];
  const shuffled = [...allSongs];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 10);
};
