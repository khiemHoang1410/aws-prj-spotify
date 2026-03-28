import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import SearchContent from '../components/search/SearchContent';
import SearchResults from '../components/search/SearchResults';

export default function SearchPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { searchQuery, isBrowsing, isSearchSubmitted } = useSelector((state) => state.ui);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    dispatch(setCurrentSong(song));
  };

  if (isBrowsing) return <SearchContent />;
  if (isSearchSubmitted) return <SearchResults query={searchQuery} onPlaySong={handlePlaySong} />;

  return (
    <div className="flex flex-col items-center justify-center mt-20 text-[#b3b3b3]">
      <h3 className="text-xl font-bold text-white mb-2">Bắt đầu tìm kiếm</h3>
      <p>Tìm bài hát, nghệ sĩ, podcast và nhiều nội dung khác.</p>
    </div>
  );
}
