import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Play } from 'lucide-react';
import { getPlaylist } from '../services/EditorialService';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import CardSong from '../components/cards/CardSong';
import SkeletonCard from '../components/ui/SkeletonCard';

const COVER_FALLBACK = '/pictures/whiteBackground.jpg';
const PAGE_SIZE = 20;

export default function EditorialPlaylistDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    getPlaylist(id, { limit: PAGE_SIZE })
      .then((data) => {
        if (!data) {
          setError('Không tìm thấy playlist này.');
          return;
        }
        setPlaylist(data);
        // API returns songs nested — handle both shapes
        const songItems = data.songs?.items ?? data.songs ?? [];
        const cursor = data.songs?.nextCursor ?? null;
        setSongs(songItems.map(normalizeSong));
        setNextCursor(cursor);
      })
      .catch(() => setError('Không thể tải playlist. Vui lòng thử lại.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await getPlaylist(id, { limit: PAGE_SIZE, cursor: nextCursor });
      if (data) {
        const songItems = data.songs?.items ?? data.songs ?? [];
        const cursor = data.songs?.nextCursor ?? null;
        setSongs((prev) => [...prev, ...songItems.map(normalizeSong)]);
        setNextCursor(cursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center mt-20">
        <p className="text-neutral-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Gradient header */}
      <div className="flex items-end gap-6 h-64 pb-6 bg-gradient-to-b from-purple-800/60 to-transparent mb-6 -mx-6 -mt-6 px-6">
        <img
          src={playlist.coverUrl || COVER_FALLBACK}
          alt={playlist.name}
          className="w-44 h-44 rounded-md shadow-2xl object-contain bg-neutral-800 flex-shrink-0"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = COVER_FALLBACK; }}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white uppercase mb-1">Editorial Playlist</p>
          <h1 className="text-4xl font-extrabold text-white truncate mb-2">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-sm text-neutral-300 line-clamp-2">{playlist.description}</p>
          )}
          <p className="text-sm text-neutral-400 mt-1">{playlist.songCount ?? songs.length} bài hát</p>
        </div>
      </div>

      {/* Song grid */}
      {songs.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {songs.map((song) => (
              <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />
            ))}
          </div>

          {nextCursor && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 rounded-full border border-neutral-600 text-neutral-300 text-sm hover:border-white hover:text-white transition disabled:opacity-50"
              >
                {isLoadingMore ? 'Đang tải...' : 'Xem thêm'}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-neutral-500 text-sm mt-10 text-center">Playlist này chưa có bài hát nào.</p>
      )}
    </div>
  );
}

/**
 * Map API song shape → CardSong expected shape
 * API: { id, title, artistName, coverUrl, duration }
 * CardSong: { song_id, title, artist_name, image_url }
 */
function normalizeSong(song) {
  return {
    song_id: song.songId ?? song.id ?? song.song_id,
    title: song.title,
    artist_name: song.artistName ?? song.artist_name,
    image_url: song.coverUrl ?? song.image_url ?? COVER_FALLBACK,
    duration: song.duration,
  };
}
