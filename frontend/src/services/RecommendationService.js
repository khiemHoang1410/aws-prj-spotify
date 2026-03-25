// [S8-001.2-5] RecommendationService — 4 thuật toán đề xuất bài hát

export const getPersonalizedSongs = (likedSongs, allSongs) => {
  if (!likedSongs || likedSongs.length === 0) return [];

  const likedIds = new Set(likedSongs.map((s) => s.song_id));
  const likedArtists = new Set(likedSongs.map((s) => s.artist_name));
  const likedCategories = new Set(likedSongs.flatMap((s) => s.categories || []));
  const maxPlayCount = Math.max(...allSongs.map((s) => s.play_count || 0), 1);

  const candidates = allSongs;

  const scored = candidates.map((song) => {
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

export const getTrendingSongs = (allSongs) => {
  return [...allSongs].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 10);
};

export const getNewReleases = (allSongs) => {
  return [...allSongs]
    .sort((a, b) => new Date(b.created_at || '2020-01-01') - new Date(a.created_at || '2020-01-01'))
    .slice(0, 10);
};

export const getDiscoverMix = (likedSongs, allSongs) => {
  const likedIds = new Set((likedSongs || []).map((s) => s.song_id));
  const candidates = [...allSongs];
  if (candidates.length === 0) return [];

  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 10);
};
