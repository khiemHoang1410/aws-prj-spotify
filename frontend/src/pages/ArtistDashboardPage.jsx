import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Music, Headphones, Users, TrendingUp, Play, Clock, Pencil, Trash2, PlusCircle, Disc3 } from 'lucide-react';
import { showToast } from '../store/uiSlice';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { ROLES } from '../constants/enums';
import { getArtistStats, getArtistByUserId } from '../services/ArtistService';
import { getSongs, deleteSong } from '../services/SongService';
import { getAlbumsByArtist, createAlbum, deleteAlbum } from '../services/AlbumService';

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
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [stats, setStats] = useState(null);
  const [mySongs, setMySongs] = useState([]);
  const [myAlbums, setMyAlbums] = useState([]);
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== ROLES.ARTIST) {
      navigate('/');
      return;
    }
    
    // Guard: Check artist_id exists
    if (!user.artist_id) {
      dispatch(showToast({ 
        message: 'Không tìm thấy hồ sơ nghệ sĩ. Vui lòng xác minh lại.', 
        type: 'warning' 
      }));
      navigate('/artist-verify');
      return;
    }
    
    setIsLoading(true);

    // Ưu tiên artist_id đã có trong user profile,
    // nếu chưa có thì resolve từ userId → artist profile
    const resolveArtistId = user.artist_id
      ? Promise.resolve(user.artist_id)
      : getArtistByUserId(user.user_id).then((a) => a?.id ?? null);

    resolveArtistId.then((artistId) => {
      if (!artistId) {
        setIsLoading(false);
        return;
      }
      Promise.all([
        getArtistStats(artistId),
        getSongs(),
        getAlbumsByArtist(user.username),
      ]).then(([statsData, allSongs, albums]) => {
        setStats(statsData);
        setMySongs(allSongs.filter((s) => s.artist_id === artistId));
        setMyAlbums(albums);
      }).finally(() => setIsLoading(false));
    });
  }, [user, dispatch]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  const handleEditSong = (song) => {
    navigate(`/edit-song/${song.song_id}`);
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Bạn có chắc muốn xoá bài hát này?')) return;
    const result = await deleteSong(songId);
    if (result.success) {
      setMySongs((prev) => prev.filter((s) => s.song_id !== songId));
      dispatch(showToast({ message: 'Đã xoá bài hát', type: 'success' }));
    }
  };

  // [S8-007.4] Album CRUD handlers
  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    const result = await createAlbum({
      title: newAlbumTitle.trim(),
      artist_id: user.artist_id || user.user_id,
      artist_name: user.username,
      image_url: IMG_FALLBACK,
      release_date: new Date().toISOString().slice(0, 10),
      songIds: [],
    });
    if (result.success && result.data?.id) {
      setMyAlbums((prev) => [...prev, result.data]);
      setNewAlbumTitle('');
      setIsCreateAlbumOpen(false);
      dispatch(showToast({ message: 'Đã tạo album mới', type: 'success' }));
      navigate(`/album/${result.data.id}`);
    } else if (result.success) {
      dispatch(showToast({ message: 'Đã tạo album nhưng không thể navigate. Vào Dashboard để xem.', type: 'warning' }));
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm('Bạn có chắc muốn xoá album này?')) return;
    const result = await deleteAlbum(albumId);
    if (result.success) {
      setMyAlbums((prev) => prev.filter((a) => a.id !== albumId));
      dispatch(showToast({ message: 'Đã xoá album', type: 'success' }));
    }
  };

  const handleEditAlbum = (album) => {
    navigate(`/album/${album.id}`);
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">Bài hát của tôi</h2>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition"
        >
          <PlusCircle size={16} />
          Thêm bài hát
        </button>
      </div>
      {mySongs.length > 0 ? (
        <>
          <div className="grid grid-cols-[24px_1fr_1fr_56px_80px] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
            <span>#</span>
            <span>Tiêu đề</span>
            <span>Thể loại</span>
            <span className="flex justify-center"><Clock size={14} /></span>
            <span className="text-center">Thao tác</span>
          </div>
          <div className="flex flex-col">
            {mySongs.map((song, idx) => (
              <div
                key={song.song_id}
                className="grid grid-cols-[24px_1fr_1fr_56px_80px] gap-4 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition"
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
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditSong(song); }}
                    className="text-neutral-400 hover:text-white transition"
                    title="Chỉnh sửa"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSong(song.song_id); }}
                    className="text-neutral-400 hover:text-red-400 transition"
                    title="Xoá"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-neutral-400 text-sm mt-4">
          {isLoading ? 'Đang tải...' : 'Bạn chưa có bài hát nào trên hệ thống.'}
        </div>
      )}

      {/* [S8-007.3] Albums section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Albums</h2>
          <button
            onClick={() => setIsCreateAlbumOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition"
          >
            <PlusCircle size={16} />
            Tạo album mới
          </button>
        </div>

        {/* Inline create form */}
        {isCreateAlbumOpen && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-800 rounded-lg">
            <input
              type="text"
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
              placeholder="Tên album..."
              className="flex-1 bg-neutral-700 text-white text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAlbum()}
            />
            <button
              onClick={handleCreateAlbum}
              className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition"
            >
              Tạo
            </button>
            <button
              onClick={() => { setIsCreateAlbumOpen(false); setNewAlbumTitle(''); }}
              className="px-4 py-2 rounded-full border border-neutral-600 text-white text-sm font-semibold hover:border-white transition"
            >
              Huỷ
            </button>
          </div>
        )}

        {/* Album list */}
        {myAlbums.length > 0 ? (
          <div className="flex flex-col gap-1">
            {myAlbums.map((album) => (
              <div
                key={album.id}
                className="flex items-center gap-4 px-4 py-3 rounded-md hover:bg-white/5 cursor-pointer group transition"
                onClick={() => handleEditAlbum(album)}
              >
                <img
                  src={album.image_url || IMG_FALLBACK}
                  alt={album.title}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{album.title}</p>
                  <p className="text-xs text-neutral-400">{album.songIds?.length || 0} bài hát • {album.release_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Disc3 size={16} className="text-neutral-500" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                    className="text-neutral-400 hover:text-red-400 transition"
                    title="Xoá album"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-neutral-400 text-sm mt-2">
            {isLoading ? 'Đang tải...' : 'Bạn chưa có album nào.'}
          </div>
        )}
      </div>
    </div>
  );
}
