import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchSongs } from '../../services/SongService';
import { searchArtists } from '../../services/ArtistService';
import { CATEGORIES } from '../../constants/enums';
import CardArtist from '../cards/CardArtist';
import SkeletonCard from '../ui/SkeletonCard';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export default function SearchResults({ query, onPlaySong }) {
  const navigate = useNavigate();
  const [results, setResults] = useState({ songs: [], artists: [], topResult: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [matchedCategories, setMatchedCategories] = useState([]);

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResults({ songs: [], artists: [], topResult: null });
      setMatchedCategories([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setActiveCategory(null);
    setError(null);

    Promise.all([
      searchSongs(query.trim()),
      searchArtists(query.trim()),
    ]).then(([songs, artists]) => {
      setMatchedCategories([]);
      const topResult = artists[0]
        ? { ...artists[0], resultType: 'artist' }
        : songs[0]
        ? { ...songs[0], resultType: 'song' }
        : null;
      setResults({ songs: songs.slice(0, 4), artists: artists.slice(0, 6), topResult });
    }).catch(() => {
      setError('Không thể tìm kiếm. Vui lòng thử lại.');
    }).finally(() => {
      setIsLoading(false);
    });
  }, [query]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 mt-2 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/5"><SkeletonCard variant="large" /></div>
          <div className="w-full lg:w-3/5 flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} variant="row" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 text-center">
        <p className="text-neutral-400 text-lg mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!results.topResult && results.songs.length === 0 && results.artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 text-center">
        <p className="text-neutral-400 text-lg">Không tìm thấy kết quả cho &ldquo;{query}&rdquo;</p>
        <p className="text-neutral-600 text-sm mt-2">Hãy thử tìm kiếm từ khác</p>
      </div>
    );
  }

  const { topResult, songs, artists } = results;

  const filteredSongs = activeCategory
    ? songs.filter((s) => s.categories?.includes(activeCategory))
    : songs;

  const getCategoryLabel = (catId) => {
    const found = CATEGORIES.find((c) => c.id === catId);
    return found ? found.name : catId;
  };

  return (
    <div className="flex flex-col gap-10 mt-2 pb-8">

      {/* KHỐI 1: KẾT QUẢ HÀNG ĐẦU & BÀI HÁT */}
      {topResult && (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Kết quả hàng đầu */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-4">Kết quả hàng đầu</h2>
            <div
              className="bg-[#181818] hover:bg-[#282828] transition duration-300 cursor-pointer p-5 rounded-lg relative group flex-1 flex flex-col justify-center"
              onClick={() => {
                if (topResult.resultType === 'artist') {
                  navigate(`/artist/${topResult.id}`);
                } else {
                  onPlaySong(topResult);
                }
              }}
            >
              <img
                src={topResult.image_url || topResult.photo_url || IMG_FALLBACK}
                className={`w-[100px] h-[100px] mb-6 object-cover shadow-lg ${topResult.resultType === 'artist' ? 'rounded-full' : 'rounded-lg'}`}
                alt={topResult.name || topResult.title}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
              />
              <h3 className="text-3xl font-bold text-white mb-2">{topResult.name || topResult.title}</h3>
              <div className="flex items-center gap-2">
                <span className="bg-[#121212] text-white text-sm font-bold px-3 py-1 rounded-full">
                  {topResult.resultType === 'artist' ? 'Nghệ sĩ' : 'Bài hát'}
                </span>
              </div>
              <button className="absolute bottom-6 right-6 bg-green-500 text-black rounded-full p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-105 hover:bg-green-400">
                <Play fill="currentColor" size={24} className="ml-1" />
              </button>
            </div>
          </div>

          {/* Danh sách bài hát */}
          {songs.length > 0 && (
            <div className="w-full lg:w-3/5 flex flex-col">
              <h2 className="text-2xl font-bold text-white mb-4">Bài hát</h2>
              {/* Category filter pills */}
              {matchedCategories.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  <button
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${!activeCategory ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
                    onClick={() => setActiveCategory(null)}
                  >
                    Tất cả
                  </button>
                  {matchedCategories.map((cat) => (
                    <button
                      key={cat}
                      className={`px-3 py-1 rounded-full text-sm font-semibold transition ${activeCategory === cat ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-1">
                {filteredSongs.map((song) => (
                  <div
                    key={song.song_id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition"
                    onClick={() => onPlaySong(song)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-11 h-11 flex-shrink-0">
                        <img
                          src={song.image_url || IMG_FALLBACK}
                          className="w-full h-full object-cover rounded"
                          alt={song.title}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                        />
                        <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded">
                          <Play fill="white" size={16} className="ml-0.5" />
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-base truncate">{song.title}</span>
                        <span className="text-[#b3b3b3] text-sm truncate">{song.artist_name}</span>
                      </div>
                    </div>
                    {song.duration && (
                      <span className="text-[#b3b3b3] text-sm mr-4 flex-shrink-0">
                        {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* KHỐI 2: NGHỆ SĨ LIÊN QUAN */}
      {artists.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Nghệ sĩ</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {artists.map((artist) => (
              <CardArtist key={artist.id} artist={artist} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
