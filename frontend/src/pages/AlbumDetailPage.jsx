import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Clock, ArrowLeft, PlusCircle, MinusCircle, Settings2 } from 'lucide-react';
import { showToast } from '../store/uiSlice';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { getAlbumById, getAlbumSongs, addSongToAlbum, removeSongFromAlbum } from '../services/AlbumService';
import { getSongs } from '../services/SongService';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AlbumDetailPage() {
  const dispatch = useDispatch();
  const { id: activeAlbumId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [availableSongs, setAvailableSongs] = useState([]);

  // So sánh theo artist_id — chính xác hơn so sánh tên
  const isOwner = !!(user?.artist_id && album?.artist_id && user.artist_id === album.artist_id);

  const refreshSongs = async (albumId) => {
    const data = await getAlbumSongs(albumId);
    setSongs(data);
  };

  useEffect(() => {
    if (!activeAlbumId) return;
    setIsLoading(true);
    Promise.all([getAlbumById(activeAlbumId), getAlbumSongs(activeAlbumId)])
      .then(([albumData, songData]) => {
        setAlbum(albumData);
        setSongs(songData);
      })
      .finally(() => setIsLoading(false));
  }, [activeAlbumId]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  const handlePlayAll = () => {
    if (songs.length > 0) handlePlaySong(songs[0]);
  };

  const handleToggleSongPicker = async () => {
    if (showSongPicker) {
      setShowSongPicker(false);
      return;
    }
    const allSongs = await getSongs();
    const albumSongIds = songs.map((s) => s.song_id);
    // Lọc theo artist_id — chính xác hơn so sánh tên
    setAvailableSongs(
      allSongs.filter((s) => s.artist_id === album?.artist_id && !albumSongIds.includes(s.song_id))
    );
    setShowSongPicker(true);
  };

  const handleAddSong = async (songId) => {
    const result = await addSongToAlbum(activeAlbumId, songId);
    if (result.success) {
      dispatch(showToast({ message: 'Đã thêm bài hát vào album', type: 'success' }));
      setAvailableSongs((prev) => prev.filter((s) => s.song_id !== songId));
      await refreshSongs(activeAlbumId);
    } else {
      dispatch(showToast({ message: 'Lỗi khi thêm bài hát', type: 'error' }));
    }
  };

  const handleRemoveSong = async (songId) => {
    const result = await removeSongFromAlbum(activeAlbumId, songId);
    if (result.success) {
      dispatch(showToast({ message: 'Đã xóa bài hát khỏi album', type: 'success' }));
      await refreshSongs(activeAlbumId);
      // Nếu song picker đang mở, cập nhật lại danh sách available
      if (showSongPicker) {
        const allSongs = await getSongs();
        const updatedIds = songs.filter((s) => s.song_id !== songId).map((s) => s.song_id);
        setAvailableSongs(allSongs.filter((s) => s.artist_id === album?.artist_id && !updatedIds.includes(s.song_id)));
      }
    } else {
      dispatch(showToast({ message: 'Lỗi khi xóa bài hát', type: 'error' }));
    }
  };

  const handleGoToArtist = () => {
    if (album?.artist_id) navigate(`/artist/${album.artist_id}`);
  };

  if (!activeAlbumId) return null;

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="mt-10 text-center text-neutral-400">Không tìm thấy album.</div>
    );
  }

  // songs state đã được load riêng từ /albums/{id}/songs

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition"
      >
        <ArrowLeft size={20} />
        <span className="text-sm">Quay lại</span>
      </button>

      {/* Gradient header */}
      <div className="flex items-end gap-6 mb-6 bg-gradient-to-b from-neutral-700/50 to-transparent p-6 rounded-xl -mx-2">
        <img
          src={album.image_url || IMG_FALLBACK}
          alt={album.title}
          className="w-48 h-48 rounded-lg object-cover shadow-2xl flex-shrink-0"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Album</p>
          <h1 className="text-4xl font-extrabold text-white mb-2">{album.title}</h1>
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <button
              onClick={handleGoToArtist}
              className="font-semibold text-white hover:underline"
            >
              {album.artist_name}
            </button>
            <span>•</span>
            <span>{album.release_date}</span>
            <span>•</span>
            <span>{songs.length} bài hát</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayAll}
          disabled={songs.length === 0}
          className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition shadow-lg disabled:opacity-50"
        >
          <Play size={24} className="text-black fill-black ml-1" />
        </button>
        {isOwner && (
          <button
            onClick={handleToggleSongPicker}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
              showSongPicker ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Settings2 size={16} />
            Quản lý bài hát
          </button>
        )}
      </div>

      {/* Song picker panel */}
      {showSongPicker && (
        <div className="mb-6 bg-[#282828] rounded-xl p-4 border border-[#3e3e3e]">
          <h3 className="text-sm font-bold text-white mb-3">Thêm bài hát vào album</h3>
          {availableSongs.length === 0 ? (
            <p className="text-sm text-neutral-400">Không có bài hát nào khả dụng để thêm.</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {availableSongs.map((song) => (
                <div
                  key={song.song_id}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.image_url || IMG_FALLBACK}
                      alt={song.title}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                    />
                    <span className="text-sm text-white truncate">{song.title}</span>
                  </div>
                  <button
                    onClick={() => handleAddSong(song.song_id)}
                    className="text-green-400 hover:text-green-300 transition flex-shrink-0"
                    title="Thêm vào album"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Song table */}
      {songs.length > 0 ? (
        <>
          <div className={`grid ${isOwner ? 'grid-cols-[24px_1fr_1fr_56px_40px]' : 'grid-cols-[24px_1fr_1fr_56px]'} gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1`}>
            <span>#</span>
            <span>Tiêu đề</span>
            <span>Album</span>
            <span className="flex justify-center"><Clock size={14} /></span>
            {isOwner && <span />}
          </div>
          <div className="flex flex-col">
            {songs.map((song, idx) => (
              <div
                key={song.song_id}
                className={`grid ${isOwner ? 'grid-cols-[24px_1fr_1fr_56px_40px]' : 'grid-cols-[24px_1fr_1fr_56px]'} gap-4 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition`}
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
                  {song.album_name || '—'}
                </span>
                <span className="text-sm text-neutral-400 flex items-center justify-center">{formatDuration(song.duration)}</span>
                {isOwner && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.song_id); }}
                    className="text-neutral-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    title="Xóa khỏi album"
                  >
                    <MinusCircle size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon={Play} title="Album trống" description="Album này chưa có bài hát nào." />
      )}
    </div>
  );
}
