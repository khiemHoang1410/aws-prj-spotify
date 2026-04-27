import { useState, useEffect } from 'react';
import CardGenre from '../cards/CardGenre';
import { getGenres } from '../../services/GenreService';
import SearchBar from '../search/SearchBar';

export default function SearchContent() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      const data = await getGenres();
      setGenres(data);
      setLoading(false);
    };
    fetchGenres();
  }, []);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">Duyệt tìm tất cả</h2>
      
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-800 rounded-lg aspect-square" />
          ))}
        </div>
      ) : (
        // Grid thay đổi số cột tùy theo kích thước màn hình
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {genres.map(genre => (
            <CardGenre key={genre.id} category={genre} />
          ))}
        </div>
      )}
    </div>
  );
}
