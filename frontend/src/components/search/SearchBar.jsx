import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Library } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSearchQuery, submitSearch } from '../../store/uiSlice';
import { search } from '../../services/SearchService';

export default function SearchBar({ onOpenBrowse }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchQuery, isBrowsing, isSearchSubmitted } = useSelector(state => state.ui);
  const [dropDownResults, setDropDownResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef(null);

  const getSongPath = (song) => {
    const slug = song?.songSlug || song?.slug || song?.song_slug;
    const id = song?.song_id || song?.id;
    return slug ? `/song/${slug}` : id ? `/song/${id}` : '/search';
  };

  const handleResultClick = (item) => {
    if (!item) return;

    if (item.category === 'song') {
      navigate(getSongPath(item.originalData));
    } else if (item.category === 'artist') {
      const artistId = item?.originalData?.id;
      if (artistId) navigate(`/artist/${artistId}`);
    } else if (item.category === 'album') {
      const albumId = item?.originalData?.id;
      if (albumId) navigate(`/album/${albumId}`);
    }

    dispatch(submitSearch());
  };

  // Gọi API search với debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Không gọi API nếu query rỗng
    if (!searchQuery.trim()) {
      setDropDownResults([]);
      return;
    }

    // Set timer để gọi API sau 300ms (debounce)
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await search(searchQuery, 'all');
        
        // Ghép kết quả từ 3 category thành 1 mảng display
        const displayResults = [];
        
        // Thêm songs
        if (results.songs && results.songs.length > 0) {
          displayResults.push(
            ...results.songs.slice(0, 4).map(song => ({
              id: `song-${song.id}`,
              title: song.title || song.name,
              type: '🎵 Bài hát',
              artist: song.artist?.name || song.artistName || 'Unknown',
              originalData: song,
              category: 'song',
            }))
          );
        }
        
        // Thêm artists
        if (results.artists && results.artists.length > 0) {
          displayResults.push(
            ...results.artists.slice(0, 3).map(artist => ({
              id: `artist-${artist.id}`,
              title: artist.name,
              type: '🎤 Nghệ sĩ',
              artist: '',
              originalData: artist,
              category: 'artist',
            }))
          );
        }
        
        // Thêm albums
        if (results.albums && results.albums.length > 0) {
          displayResults.push(
            ...results.albums.slice(0, 3).map(album => ({
              id: `album-${album.id}`,
              title: album.title || album.name,
              type: '💿 Album',
              artist: album.artist?.name || album.artistName || 'Unknown',
              originalData: album,
              category: 'album',
            }))
          );
        }
        
        setDropDownResults(displayResults);
      } catch (error) {
        console.error('Search failed:', error);
        setDropDownResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Bắt sự kiện bấm phím Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      dispatch(submitSearch());
    }
  };

  return (
    // relative để DropDown có thể neo vào vị trí của thanh Search
    <div className="relative flex-1 max-w-[400px]">
      
      {/* THANH SEARCH GỐC */}
      <div className="flex items-center bg-[#242424] rounded-full px-3 py-2 w-full border border-transparent hover:border-[#333] hover:bg-[#2a2a2a] focus-within:border-white focus-within:bg-[#242424] transition-all z-30 relative">
        <Search size={22} className="text-[#b3b3b3] mr-3 ml-1" />
        <input 
          type="text" 
          placeholder="Bạn muốn phát nội dung gì?" 
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          onKeyDown={handleKeyDown}
          className="bg-transparent text-white focus:outline-none w-full text-[15px] placeholder-[#b3b3b3]"
        />
        {searchQuery && (
          <button onClick={() => dispatch(setSearchQuery(''))} className="text-[#b3b3b3] hover:text-white mr-2">
            <X size={20} />
          </button>
        )}
        <div className="w-[1px] h-6 bg-[#b3b3b3]/30 mx-2"></div>
        
        {/* Nút Library */}
        <button 
          onClick={onOpenBrowse} 
          className={`ml-2 mr-1 transition-colors ${isBrowsing ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}
          title="Duyệt tìm chuyên mục"
        >
          <Library size={22} className={isBrowsing ? "fill-white" : ""} />
        </button>
      </div>

      {/* GIAO DIỆN DROPDOWN */}
      {searchQuery.length > 0 && !isSearchSubmitted && (
        <div className="absolute top-14 left-0 w-full bg-[#242424] rounded-lg shadow-2xl z-50 p-2 border border-[#333]">
          <h4 className="text-white font-bold px-3 py-2 text-sm">
            {isLoading ? '⏳ Đang tìm kiếm...' : 'Kết quả liên quan'}
          </h4>
          <div className="flex flex-col gap-1 mt-1 max-h-[400px] overflow-y-auto">
            {dropDownResults.length > 0 ? (
              dropDownResults.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col px-3 py-2 hover:bg-[#333] rounded-md cursor-pointer group"
                  onClick={() => handleResultClick(item)}
                >
                  <span className="text-white text-base font-semibold group-hover:underline">{item.title}</span>
                  <span className="text-[#b3b3b3] text-sm">
                    {item.type} {item.artist ? `• ${item.artist}` : ''}
                  </span>
                </div>
              ))
            ) : !isLoading ? (
              <div className="px-3 py-4 text-center text-[#b3b3b3] text-sm">
                Không tìm thấy kết quả
              </div>
            ) : null}
          </div>
          
          {/* Nút xem toàn bộ */}
          {dropDownResults.length > 0 && (
            <div 
              className="px-3 py-3 mt-2 text-sm font-bold text-white hover:text-green-500 cursor-pointer border-t border-[#333]"
              onClick={() => dispatch(submitSearch())}
            >
              Xem tất cả kết quả cho "{searchQuery}"
            </div>
          )}
        </div>
      )}

    </div>
  );
}
