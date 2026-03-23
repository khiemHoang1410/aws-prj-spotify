import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Music } from 'lucide-react';
import { setView } from '../store/uiSlice';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { getSongsByCategory } from '../services/SongService';
import CardSong from '../components/CardSong';
import EmptyState from '../components/shared/EmptyState';
import SkeletonCard from '../components/shared/SkeletonCard';

export default function CategoryPage() {
  const dispatch = useDispatch();
  const { activeCategoryId, activeCategoryName } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeCategoryId) return;
    setIsLoading(true);
    const result = getSongsByCategory(activeCategoryId);
    setSongs(result);
    setIsLoading(false);
  }, [activeCategoryId]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  return (
    <div>
      {/* Gradient header */}
      <div className="flex items-end gap-4 h-56 px-2 pb-6 bg-gradient-to-b from-green-800/60 to-transparent mb-6 -mx-6 -mt-6 px-6">
        <button
          onClick={() => dispatch(setView('search'))}
          className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition mb-1"
          title="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white uppercase mb-1">Thể loại</p>
          <h1 className="text-4xl font-extrabold text-white truncate">{activeCategoryName || activeCategoryId}</h1>
          <p className="text-sm text-neutral-300 mt-1">{songs.length} bài hát</p>
        </div>
      </div>

      {/* Song grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : songs.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Music}
            title="Chưa có bài hát"
            description={`Không có bài hát nào trong thể loại này.`}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {songs.map((song) => (
            <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />
          ))}
        </div>
      )}
    </div>
  );
}
