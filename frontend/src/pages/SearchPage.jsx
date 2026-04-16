import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import SearchContent from '../components/search/SearchContent';
import SearchResults from '../components/search/SearchResults';

export default function SearchPage() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { searchQuery, isBrowsing, isSearchSubmitted } = useSelector((state) => state.ui);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    dispatch(setCurrentSong(song));
  };

  if (isBrowsing) return <SearchContent />;
  if (isSearchSubmitted) return <SearchResults query={searchQuery} onPlaySong={handlePlaySong} />;

  return <SearchContent />;
}
