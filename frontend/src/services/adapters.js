    /**
 * Adapter layer: normalize data từ BE (camelCase) về format FE đang dùng (snake_case).
 * Giữ nguyên components, chỉ transform ở service layer.
 */

export const adaptSong = (song) => {
  if (!song) return null;
  return {
    song_id: song.id || song.songId || song.song_id,
    title: song.title,
    artist_name: song.artistName || song.artist_name || '',
    artist_id: song.artistId || song.artist_id || null,
    image_url: song.coverUrl || song.image_url || null,
    audio_url: song.fileUrl || song.audio_url || null,
    duration: song.duration,
    lyrics: song.lyrics || null,
    album_id: song.albumId || song.album_id || null,
    album_name: song.albumName || song.album_name || null,
    created_at: song.createdAt || song.created_at || null,
    mv_url: song.mvUrl || song.mv_url || song.video_url || null,
    // Giữ lại các field FE-only nếu có
    video_url: song.video_url || null,
    artist_photo: song.artist_photo || null,
    artist_background: song.artist_background || null,
    has_lyrics: !!(song.lyrics),
    categories: song.categories || [],
    play_count: song.playCount || song.play_count || 0,
    genre: song.genre || null,
  };
};

export const adaptArtist = (artist) => {
  if (!artist) return null;
  // Extract id từ pk nếu id không có trực tiếp (pk = ARTIST#uuid)
  const id = artist.id || (artist.pk ? artist.pk.replace(/^ARTIST#/, '') : null);
  return {
    id,
    artist_id: id,
    name: artist.name,
    bio: artist.bio || null,
    photo_url: artist.photoUrl || artist.photo_url || null,
    image_url: artist.photoUrl || artist.image_url || null,
    artist_background: artist.backgroundUrl || artist.artist_background || null,
    monthly_listeners: artist.monthlyListeners || artist.monthly_listeners || '0',
    followers: artist.followers || 0,
    isVerified: artist.isVerified || false,
    credits: artist.credits || null,
    userId: artist.userId || null,
    created_at: artist.createdAt || artist.created_at || null,
  };
};

export const adaptAlbum = (album) => {
  if (!album) return null;
  return {
    id: album.id,
    title: album.title,
    artist_id: album.artistId || album.artist_id || null,
    artist_name: album.artistName || album.artist_name || null,
    image_url: album.coverUrl || album.image_url || null,
    release_date: album.releaseDate || album.release_date || null,
    songs: (album.songs || []).map(adaptSong),
    created_at: album.createdAt || album.created_at || null,
  };
};

export const adaptPlaylist = (playlist) => {
  if (!playlist) return null;
  return {
    id: playlist.id,
    name: playlist.name,
    owner: playlist.ownerName || playlist.owner || null,
    userId: playlist.userId || null,
    image_url: playlist.coverUrl || playlist.image_url || null,
    songs: (playlist.songs || []).map(adaptSong),
    created_at: playlist.createdAt || playlist.created_at || null,
  };
};

export const adaptUser = (user) => {
  if (!user) return null;
  return {
    user_id: user.userId || user.id || user.user_id,
    id: user.userId || user.id,
    username: user.displayName || user.username || user.name || '',
    name: user.displayName || user.name || user.username || '',
    email: user.email,
    avatar_url: user.avatarUrl || user.avatar_url || null,
    role: user.role || 'listener',
    isVerified: user.isVerified || false,
    artist_id: user.artistId || user.artist_id || null, // Artist profile UUID (khác với user_id)
  };
};

export const adaptPaginatedResponse = (data, adaptFn) => {
  // BE trả về { items: [], nextCursor: '' }
  // FE expect array trực tiếp
  if (Array.isArray(data)) return data.map(adaptFn);
  if (data?.items) return data.items.map(adaptFn);
  return [];
};

export const normalizeHistoryEntry = (item) => {
  if (!item) return null;
  return {
    entryId: item.entryId || null,
    songId: item.songId || item.song_id || null,
    title: item.songTitle || item.title || '',
    artist_name: item.artistName || item.artist_name || '',
    artist_id: item.artistId || item.artist_id || null,
    image_url: item.coverUrl || item.image_url || null,
    duration: item.duration || 0,
    played_at: item.playedAt || item.played_at || null,
  };
};
