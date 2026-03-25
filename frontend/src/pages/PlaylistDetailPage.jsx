import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Shuffle, Clock, Music, Search, PlusCircle, Check, Trash2 } from 'lucide-react'; // [S6-001.2]
import { setCurrentSong, clearQueue, addToQueue, playNextSong, setShuffleMode } from '../store/playerSlice'; // [S7-005.2]
import { openModal } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { getPlaylistById, searchSongs, addSongToPlaylist, removeSongFromPlaylist } from '../services/SongService'; // [S6-001.1]
import EmptyState from '../components/shared/EmptyState';
import ErrorMessage from '../components/shared/ErrorMessage';
import SkeletonCard from '../components/shared/SkeletonCard';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlaylistDetailPage() {
  const dispatch = useDispatch();
  const { activePlaylistId } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [addedIds, setAddedIds] = useState([]);

  // [S7-005.2] Shuffle state
  const [isShuffleActive, setIsShuffleActive] = useState(false);

  useEffect(() => {
    if (!activePlaylistId) return;
    setIsLoading(true);
    setError('');
    getPlaylistById(activePlaylistId)
      .then((data) => {
        if (!data) setError('Không tìm thấy playlist này.');
        else setPlaylist(data);
      })
      .catch(() => setError('Không thể tải playlist. Vui lòng thử lại.'))
      .finally(() => setIsLoading(false));
  }, [activePlaylistId]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  const handlePlayAll = () => {
    if (!playlist?.songs?.length) return;
    handlePlaySong(playlist.songs[0]);
  };

  useEffect(() => {
    if (searchTerm.trim().length < 1) {
      setSearchResult([]);
      return;
    }
    setSearchResult(searchSongs(searchTerm.trim()).slice(0, 8));
  }, [searchTerm]);

  const handleAddSong = async (song) => {
    if (addedIds.includes(song.song_id)) return;
    await addSongToPlaylist(playlist.id, song);
    setAddedIds((prev) => [...prev, song.song_id]);
    setPlaylist((prev) => ({
      ...prev,
      songs: [...(prev.songs || []), song],
    }));
    dispatch(showToast({ message: `Đã thêm "${song.title}" vào playlist`, type: 'success' }));
  };

  // [S6-001.5] handleRemoveSong
  const handleRemoveSong = async (songId) => {
    await removeSongFromPlaylist(playlist.id, songId);
    setPlaylist((prev) => ({
      ...prev,
      songs: prev.songs.filter((s) => s.song_id !== songId),
    }));
    dispatch(showToast({ message: 'Đã xoá bài hát khỏi playlist', type: 'success' }));
  };

  // [S7-005.3] Fisher-Yates shuffle play
  const handleShuffle = () => {
    if (!playlist?.songs?.length) return;
    if (!isShuffleActive) {
      dispatch(clearQueue());
      const shuffled = [...playlist.songs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      shuffled.forEach((s) => dispatch(addToQueue(s)));
      dispatch(setShuffleMode(true));
      dispatch(playNextSong());
      setIsShuffleActive(true);
    } else {
      dispatch(setShuffleMode(false));
      setIsShuffleActive(false);
    }
  };

  if (!activePlaylistId) {
    return (
      <div className="flex items-center justify-center mt-20">
        <EmptyState icon={Music} title="Chọn một playlist" description="Hãy chọn playlist từ thư viện để xem chi tiết." />
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

  if (error) {
    return (
      <div className="mt-10">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div>
      {/* Gradient header */}
      <div className="flex items-end gap-6 h-64 px-2 pb-6 bg-gradient-to-b from-purple-800/60 to-transparent mb-6 -mx-6 -mt-6 px-6">
        <img
          src={playlist.image_url}
          alt={playlist.name}
          className="w-44 h-44 rounded-md shadow-2xl object-cover flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white uppercase mb-1">Danh sách phát</p>
          <h1 className="text-4xl font-extrabold text-white truncate mb-2">{playlist.name}</h1>
          <p className="text-sm text-neutral-300">
            {playlist.owner} • {playlist.songs?.length ?? 0} bài hát
          </p>
        </div>
      </div>

      {/* Action bar — [S7-003.1] Disable Play khi playlist rỗng */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayAll}
          disabled={!playlist?.songs?.length}
          className={`w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg ${
            playlist?.songs?.length
              ? 'hover:bg-green-400 hover:scale-105 transition'
              : 'bg-green-500/50 cursor-not-allowed'
          }`}
        >
          <Play size={24} className="text-black fill-black ml-1" />
        </button>
        {/* [S7-005.4] Nút Shuffle */}
        <button
          onClick={handleShuffle}
          disabled={!playlist?.songs?.length}
          className={`transition relative ${
            !playlist?.songs?.length
              ? 'text-neutral-400 opacity-50 cursor-not-allowed'
              : isShuffleActive
                ? 'text-green-500 hover:text-green-400'
                : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Shuffle size={24} />
          {isShuffleActive && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setIsAddingSongs((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
            isAddingSongs ? 'bg-white text-black hover:bg-neutral-200' : 'border border-neutral-600 text-neutral-300 hover:border-white hover:text-white'
          }`}
        >
          <Search size={16} />
          Tìm bài hát để thêm vào
        </button>
      </div>

      {/* Song table header — [S6-001.3] thêm cột actions */}
      {playlist.songs?.length > 0 && (
        <div className="grid grid-cols-[24px_1fr_1fr_56px_40px] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Nghệ sĩ</span>
          <span className="flex justify-center"><Clock size={14} /></span>
          <span></span>
        </div>
      )}

      {/* Song rows */}
      {playlist.songs?.length > 0 ? (
        <div className="flex flex-col">
          {playlist.songs.map((song, idx) => (
            <div
              key={song.song_id}
              className="grid grid-cols-[24px_1fr_1fr_56px_40px] gap-4 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition"
              onClick={() => handlePlaySong(song)}
            >
              <span className="text-sm text-neutral-400 flex items-center group-hover:hidden">{idx + 1}</span>
              <Play
                size={16}
                className="text-white hidden group-hover:flex items-center fill-white cursor-pointer"
                onClick={() => handlePlaySong(song)}
              />
              <div className="flex items-center gap-3 min-w-0">
                <img src={song.image_url} alt={song.title} className="w-10 h-10 rounded object-cover flex-shrink-0"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }} />
                <span className="text-sm font-medium text-white truncate">{song.title}</span>
              </div>
              <span className="text-sm text-neutral-400 flex items-center truncate">{song.artist_name}</span>
              <span className="text-sm text-neutral-400 flex items-center justify-center">{formatDuration(song.duration)}</span>
              {/* [S6-001.4] Nút xoá bài hát */}
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveSong(song.song_id); }}
                className="flex items-center justify-center text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                title="Xoá khỏi playlist"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState icon={Music} title="Playlist trống" description="Playlist này chưa có bài hát nào." />
        </div>
      )}

      {/* PANEL THÊM BÀI HÁT (TASK-005) */}
      {isAddingSongs && (
        <div className="mt-8 border-t border-neutral-800 pt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Tìm bài hát để thêm</h3>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bài hát..."
              className="w-full bg-neutral-800 text-white rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-white"
              autoFocus
            />
          </div>
          {searchResult.length > 0 ? (
            <div className="flex flex-col gap-1">
              {searchResult.map((song) => {
                const alreadyAdded =
                  addedIds.includes(song.song_id) ||
                  playlist.songs?.some((s) => s.song_id === song.song_id);
                return (
                  <div
                    key={song.song_id}
                    className="flex items-center justify-between px-4 py-2 rounded-md hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={song.image_url || '/pictures/whiteBackground.jpg'}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{song.title}</p>
                        <p className="text-xs text-neutral-400 truncate">{song.artist_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddSong(song)}
                      disabled={alreadyAdded}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 ${
                        alreadyAdded
                          ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                          : 'border border-neutral-500 text-white hover:border-white hover:bg-white/10'
                      }`}
                    >
                      {alreadyAdded ? <Check size={13} /> : <PlusCircle size={13} />}
                      {alreadyAdded ? 'Đã thêm' : 'Thêm'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : searchTerm.trim().length > 0 ? (
            <p className="text-sm text-neutral-500 px-4">Không tìm thấy bài hát nào</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
