import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Music } from 'lucide-react';
import { showToast } from '../store/uiSlice';
import { getSongById, updateSong } from '../services/SongService';
import { ROLES, CATEGORIES } from '../constants/enums';
import EmptyState from '../components/ui/EmptyState';

function parseDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function durationToSeconds(str) {
  const parts = str.split(':');
  if (parts.length !== 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export default function EditSongPage() {
  const dispatch = useDispatch();
  const { id: activeEditSongId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [title, setTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [lyrics, setLyrics] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!activeEditSongId) return;
    setIsFetching(true);
    getSongById(activeEditSongId).then((song) => {
      if (song) {
        setTitle(song.title);
        setSelectedCategories(song.categories || []);
        setLyrics('');
        setDuration(parseDuration(song.duration));
      }
    }).finally(() => setIsFetching(false));
  }, [activeEditSongId]);

  if (!user || user.role !== ROLES.ARTIST) {
    return (
      <div className="flex items-center justify-center mt-20">
        <EmptyState icon={Music} title="Không có quyền truy cập" description="Chỉ nghệ sĩ mới có thể chỉnh sửa bài hát." />
      </div>
    );
  }

  if (!activeEditSongId) return null;

  const handleToggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      dispatch(showToast({ message: 'Vui lòng nhập tên bài hát', type: 'warning' }));
      return;
    }
    setIsLoading(true);
    const formData = {
      title: title.trim(),
      categories: selectedCategories,
      duration: durationToSeconds(duration),
    };
    if (lyrics.trim()) formData.lyrics = lyrics.trim();

    setIsLoading(true);
    try {
      await updateSong(activeEditSongId, formData);
      dispatch(showToast({ message: 'Đã cập nhật bài hát thành công', type: 'success' }));
      navigate('/artist-dashboard');
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi cập nhật', type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="text-neutral-400 text-sm mt-10 text-center">Đang tải thông tin bài hát...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/artist-dashboard')}
          className="text-neutral-400 hover:text-white transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Chỉnh sửa bài hát</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
        {/* Left column */}
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Tên bài hát *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-800 text-white rounded-md px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Nhập tên bài hát"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Thời lượng (MM:SS)</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-neutral-800 text-white rounded-md px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-green-500"
              placeholder="03:45"
            />
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Thể loại</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-green-500 text-black'
                      : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Lyrics */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Lời bài hát</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={12}
              className="w-full bg-neutral-800 text-white rounded-md px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-green-500 font-mono resize-none"
              placeholder="Nhập lời bài hát (mỗi dòng một câu)..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="lg:col-span-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/artist-dashboard')}
            className="px-6 py-2.5 rounded-full border border-neutral-600 text-neutral-300 hover:border-white hover:text-white text-sm font-semibold transition"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
