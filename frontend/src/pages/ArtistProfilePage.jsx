// [S6-003.3] ArtistProfilePage
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Play, Clock, BadgeCheck, UserPlus, UserCheck } from 'lucide-react';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { getArtistById, followArtist } from '../services/ArtistService';
import { getSongs } from '../services/SongService';
import EmptyState from '../components/shared/EmptyState';
import SkeletonCard from '../components/shared/SkeletonCard';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ArtistProfilePage() {
  const dispatch = useDispatch();
  const { activeArtistId } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [artist, setArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!activeArtistId) return;
    setIsLoading(true);
    Promise.all([
      getArtistById(activeArtistId),
      getSongs(),
    ]).then(([artistData, allSongs]) => {
      setArtist(artistData);
      if (artistData) {
        setArtistSongs(allSongs.filter((s) => s.artist_name === artistData.name));
      }
    }).finally(() => setIsLoading(false));
  }, [activeArtistId]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  const handlePlayAll = () => {
    if (artistSongs.length > 0) handlePlaySong(artistSongs[0]);
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    await followArtist(activeArtistId);
    setIsFollowing((prev) => !prev);
    dispatch(showToast({
      message: isFollowing ? 'Đã huỷ theo dõi' : 'Đã theo dõi nghệ sĩ',
      type: 'success',
    }));
  };

  if (!activeArtistId) {
    return (
      <div className="flex items-center justify-center mt-20">
        <EmptyState icon={Play} title="Chọn một nghệ sĩ" description="Hãy chọn nghệ sĩ từ thư viện để xem trang cá nhân." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="mt-10 text-center text-neutral-400">Không tìm thấy nghệ sĩ.</div>
    );
  }

  return (
    <div>
      {/* Hero section */}
      <div
        className="relative flex items-end gap-6 h-72 px-6 pb-6 mb-6 -mx-6 -mt-6 bg-cover bg-center"
        style={{
          backgroundImage: artist.artist_background
            ? `url(${artist.artist_background})`
            : undefined,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#121212]" />
        <div className="relative z-10 flex items-end gap-6">
          <img
            src={artist.photo_url || artist.image_url}
            alt={artist.name}
            className="w-48 h-48 rounded-full object-cover shadow-2xl ring-4 ring-neutral-800 flex-shrink-0"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
          />
          <div className="min-w-0">
            {artist.isVerified && (
              <div className="flex items-center gap-1 text-blue-400 text-xs font-semibold mb-1">
                <BadgeCheck size={16} />
                <span>Nghệ sĩ được xác minh</span>
              </div>
            )}
            <h1 className="text-5xl font-extrabold text-white mb-2">{artist.name}</h1>
            <p className="text-sm text-neutral-300">
              {artist.monthly_listeners} người nghe hàng tháng • {artist.followers?.toLocaleString()} người theo dõi
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayAll}
          disabled={artistSongs.length === 0}
          className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition shadow-lg disabled:opacity-50"
        >
          <Play size={24} className="text-black fill-black ml-1" />
        </button>
        <button
          onClick={handleFollow}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
            isFollowing
              ? 'border border-green-500 text-green-500 hover:border-green-400'
              : 'border border-neutral-600 text-white hover:border-white'
          }`}
        >
          {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
          {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </div>

      {/* Bio */}
      {artist.bio && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-2">Giới thiệu</h3>
          <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">{artist.bio}</p>
        </div>
      )}

      {/* Popular songs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Bài hát phổ biến</h3>
        {artistSongs.length > 0 ? (
          <>
            <div className="grid grid-cols-[24px_1fr_1fr_56px] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
              <span>#</span>
              <span>Tiêu đề</span>
              <span>Album</span>
              <span className="flex justify-center"><Clock size={14} /></span>
            </div>
            <div className="flex flex-col">
              {artistSongs.map((song, idx) => (
                <div
                  key={song.song_id}
                  className="grid grid-cols-[24px_1fr_1fr_56px] gap-4 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition"
                  onClick={() => handlePlaySong(song)}
                >
                  <span className="text-sm text-neutral-400 flex items-center group-hover:hidden">{idx + 1}</span>
                  <Play
                    size={16}
                    className="text-white hidden group-hover:flex items-center fill-white cursor-pointer"
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.image_url}
                      alt={song.title}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                    />
                    <span className="text-sm font-medium text-white truncate">{song.title}</span>
                  </div>
                  <span className="text-sm text-neutral-400 flex items-center truncate">{song.title}</span>
                  <span className="text-sm text-neutral-400 flex items-center justify-center">{formatDuration(song.duration)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState icon={Play} title="Chưa có bài hát" description="Nghệ sĩ này chưa có bài hát nào trên hệ thống." />
        )}
      </div>
    </div>
  );
}
