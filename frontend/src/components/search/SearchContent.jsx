import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardGenre from '../cards/CardGenre';
import { getGenres } from '../../services/GenreService';

const FILTER_TABS = [
  { id: 'all',      label: 'Tất cả' },
  { id: 'songs',    label: 'Bài hát' },
  { id: 'artists',  label: 'Nghệ sĩ' },
  { id: 'albums',   label: 'Album' },
  { id: 'playlists',label: 'Playlist' },
];

export default function SearchContent() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    getGenres().then((data) => {
      setGenres(data);
      setLoading(false);
    });
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    // Khi đang browse (chưa search), click tab genre-related thì không làm gì thêm
    // Tab này chỉ có tác dụng khi có query — giữ state để SearchResults dùng
  };

  return (
    <div className="mt-6">
      {/* Filter tabs — giống Spotify */}
      <div className="flex gap-2 flex-wrap mb-8">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-black'
                : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Duyệt tìm tất cả</h2>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-800 rounded-lg aspect-square" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3">
          {genres.map((genre) => (
            <CardGenre key={genre.id} category={genre} />
          ))}
        </div>
      )}
    </div>
  );
}
