import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Play } from 'lucide-react';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { getSongsByCategory } from '../services/SongService';
import { getCategories } from '../services/CategoryService';
import CardSong from '../components/cards/CardSong';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';

const SORT_OPTIONS = [
  { id: 'popular', label: 'Phổ biến' },
  { id: 'newest', label: 'Mới nhất' },
  { id: 'name', label: 'Tên A-Z' },
];

export default function CategoryPage() {
  const dispatch = useDispatch();
  const { id: activeCategoryId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('popular');
  const [category, setCategory] = useState(null);

  useEffect(() => {
    if (!activeCategoryId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [songsResult, categories] = await Promise.all([
          getSongsByCategory(activeCategoryId),
          getCategories(),
        ]);
        setSongs(Array.isArray(songsResult) ? songsResult : []);
        const matched = Array.isArray(categories)
          ? categories.find((c) => c.id === activeCategoryId)
          : null;
        setCategory(matched || null);
      } catch {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        setSongs([]);
        setCategory(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeCategoryId]);

  const sortedSongs = useMemo(() => {
    const copy = [...songs];
    switch (sortBy) {
      case 'popular':
        return copy.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
      case 'newest':
        return copy.sort((a, b) => new Date(b.created_at || '2020-01-01') - new Date(a.created_at || '2020-01-01'));
      case 'name':
        return copy.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
      default:
        return copy;
    }
  }, [songs, sortBy]);

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
      <div className={`flex items-end gap-4 h-56 px-2 pb-6 bg-gradient-to-b ${category ? category.color : 'from-green-800/60'} to-transparent mb-6 -mx-6 -mt-6 px-6`}>
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition mb-1"
          title="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white uppercase mb-1">Thể loại</p>
          <h1 className="text-4xl font-extrabold text-white truncate">
            {category ? category.name : activeCategoryId}
          </h1>
          <p className="text-sm text-neutral-300 mt-1">{songs.length} bài hát</p>
        </div>
      </div>

      {/* Sort + Play all controls */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={() => sortedSongs.length > 0 && handlePlaySong(sortedSongs[0])}
          disabled={sortedSongs.length === 0}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play fill="currentColor" size={18} />
          Phát tất cả
        </button>
      </div>

      {/* Song grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="mt-10 text-center">
          <p className="text-neutral-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition"
          >
            Thử lại
          </button>
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
          {sortedSongs.map((song) => (
            <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />
          ))}
        </div>
      )}
    </div>
  );
}
