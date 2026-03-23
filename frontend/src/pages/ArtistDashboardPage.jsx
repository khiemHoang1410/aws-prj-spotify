// [S6-004.2] ArtistDashboardPage
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Music, Headphones, Users, TrendingUp, Play, Clock } from 'lucide-react';
import { setView } from '../store/uiSlice';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { ROLES } from '../constants/enums';
import { getArtistStats } from '../services/ArtistService';
import { getSongs } from '../services/SongService';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

const STAT_CARDS = [
  { key: 'totalSongs', label: 'Tổng bài hát', icon: Music, color: 'text-blue-400' },
  { key: 'totalPlays', label: 'Tổng lượt nghe', icon: Headphones, color: 'text-green-400' },
  { key: 'followers', label: 'Người theo dõi', icon: Users, color: 'text-purple-400' },
  { key: 'monthlyListeners', label: 'Lượt nghe tháng', icon: TrendingUp, color: 'text-yellow-400' },
];

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ArtistDashboardPage() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [stats, setStats] = useState(null);
  const [mySongs, setMySongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== ROLES.ARTIST) {
      dispatch(setView('home'));
      return;
    }
    setIsLoading(true);
    Promise.all([
      getArtistStats(user.artist_id || user.user_id),
      getSongs(),
    ]).then(([statsData, allSongs]) => {
      setStats(statsData);
      setMySongs(allSongs.filter((s) => s.artist_name === user.username));
    }).finally(() => setIsLoading(false));
  }, [user, dispatch]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  if (!user || user.role !== ROLES.ARTIST) return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Thống kê nghệ sĩ</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="bg-neutral-800 rounded-xl p-5 flex items-center gap-4"
          >
            <div className={`${color}`}>
              <Icon size={28} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {isLoading ? '—' : (stats?.[key]?.toLocaleString?.() ?? stats?.[key] ?? '—')}
              </p>
              <p className="text-sm text-neutral-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My songs table */}
      <h2 className="text-lg font-semibold text-white mb-3">Bài hát của tôi</h2>
      {mySongs.length > 0 ? (
        <>
          <div className="grid grid-cols-[24px_1fr_1fr_56px] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
            <span>#</span>
            <span>Tiêu đề</span>
            <span>Thể loại</span>
            <span className="flex justify-center"><Clock size={14} /></span>
          </div>
          <div className="flex flex-col">
            {mySongs.map((song, idx) => (
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
                <span className="text-sm text-neutral-400 flex items-center truncate">
                  {song.categories?.join(', ') || '—'}
                </span>
                <span className="text-sm text-neutral-400 flex items-center justify-center">{formatDuration(song.duration)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-neutral-400 text-sm mt-4">
          {isLoading ? 'Đang tải...' : 'Bạn chưa có bài hát nào trên hệ thống.'}
        </div>
      )}
    </div>
  );
}
