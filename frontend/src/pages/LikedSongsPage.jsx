import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Shuffle, Clock, Heart, Music } from 'lucide-react';
import { setCurrentSong, clearQueue, addToQueue, playNextSong, setShuffleMode } from '../store/playerSlice';
import { openModal, toggleLikeSongThunk } from '../store/authSlice';
import EmptyState from '../components/ui/EmptyState';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LikedSongsPage() {
  const dispatch = useDispatch();
  const { likedSongs, isAuthenticated } = useSelector((state) => state.auth);
  const [isShuffleActive, setIsShuffleActive] = useState(false);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    dispatch(setCurrentSong(song));
  };

  const handlePlayAll = () => {
    if (likedSongs.length > 0) handlePlaySong(likedSongs[0]);
  };

  const handleShuffle = () => {
    if (!likedSongs.length) return;
    if (!isShuffleActive) {
      dispatch(clearQueue());
      const shuffled = [...likedSongs];
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-end gap-6 h-64 pb-6 bg-gradient-to-b from-purple-800/60 to-transparent mb-6 -mx-6 -mt-6 px-6">
        <div className="w-44 h-44 rounded-md shadow-2xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0">
          <Heart size={64} className="text-white" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white uppercase mb-1">Danh sách phát</p>
          <h1 className="text-4xl font-extrabold text-white truncate mb-2">Bài hát đã thích</h1>
          <p className="text-sm text-neutral-300">{likedSongs.length} bài hát</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayAll}
          disabled={!likedSongs.length}
          className={`w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg ${likedSongs.length ? 'hover:bg-green-400 hover:scale-105 transition' : 'bg-green-500/50 cursor-not-allowed'}`}
        >
          <Play size={24} className="text-black fill-black ml-1" />
        </button>
        <button
          onClick={handleShuffle}
          disabled={!likedSongs.length}
          className={`transition relative ${!likedSongs.length ? 'text-neutral-400 opacity-50 cursor-not-allowed' : isShuffleActive ? 'text-green-500 hover:text-green-400' : 'text-neutral-400 hover:text-white'}`}
        >
          <Shuffle size={24} />
          {isShuffleActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />}
        </button>
      </div>

      {/* Table header */}
      {likedSongs.length > 0 && (
        <div className="grid grid-cols-[24px_1fr_1fr_56px_40px] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Nghệ sĩ</span>
          <span className="flex justify-center"><Clock size={14} /></span>
          <span></span>
        </div>
      )}

      {/* Song rows */}
      {likedSongs.length > 0 ? (
        <div className="flex flex-col">
          {likedSongs.map((song, idx) => (
            <div
              key={song.song_id}
              className="grid grid-cols-[24px_1fr_1fr_56px_40px] gap-4 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition"
              onClick={() => handlePlaySong(song)}
            >
              <span className="text-sm text-neutral-400 flex items-center group-hover:hidden">{idx + 1}</span>
              <Play size={16} className="text-white hidden group-hover:flex items-center fill-white cursor-pointer" />
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={song.image_url || IMG_FALLBACK}
                  alt={song.title}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                />
                <span className="text-sm font-medium text-white truncate">{song.title}</span>
              </div>
              <span className="text-sm text-neutral-400 flex items-center truncate">{song.artist_name}</span>
              <span className="text-sm text-neutral-400 flex items-center justify-center">{formatDuration(song.duration)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); dispatch(toggleLikeSongThunk(song)); }}
                className="flex items-center justify-center text-green-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                title="Bỏ thích"
              >
                <Heart size={16} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState icon={Music} title="Chưa có bài hát yêu thích" description="Nhấn vào biểu tượng trái tim để thêm bài hát." />
        </div>
      )}
    </div>
  );
}
