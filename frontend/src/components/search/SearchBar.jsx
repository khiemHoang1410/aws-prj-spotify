import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Library } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSearchQuery, submitSearch } from '../../store/uiSlice';
import { setCurrentSong } from '../../store/playerSlice';
import { search } from '../../services/SearchService';
import { adaptSong, adaptArtist, adaptAlbum } from '../../services/adapters';
import { toSongUrl } from '../../utils/songUrl';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export default function SearchBar({ onOpenBrowse }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchQuery, isBrowsing, isSearchSubmitted } = useSelector((state) => state.ui);

  const [results, setResults] = useState({ songs: [], artists: [], albums: [] });
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim() || isSearchSubmitted) {
      setResults({ songs: [], artists: [], albums: [] });
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      setIsLoadingDropdown(true);
      try {
        const data = await search(searchQuery.trim());
        setResults({
          songs: (data.songs || []).slice(0, 3).map(adaptSong).filter(Boolean),
          artists: (data.artists || []).slice(0, 2).map(adaptArtist).filter(Boolean),
          albums: (data.albums || []).slice(0, 2).map(adaptAlbum).filter(Boolean),
        });
      } catch {
        setResults({ songs: [], artists: [], albums: [] });
      } finally {
        setIsLoadingDropdown(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, isSearchSubmitted]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      dispatch(submitSearch());
      setResults({ songs: [], artists: [], albums: [] });
    }
  };

  const handleSongClick = (song) => {
    dispatch(setCurrentSong(song));
    navigate(toSongUrl(song));
    dispatch(setSearchQuery(''));
    setResults({ songs: [], artists: [], albums: [] });
  };

  const handleArtistClick = (artist) => {
    navigate(`/artist/${artist.id}`);
    dispatch(setSearchQuery(''));
    setResults({ songs: [], artists: [], albums: [] });
  };

  const handleAlbumClick = (album) => {
    navigate(`/album/${album.id}`);
    dispatch(setSearchQuery(''));
    setResults({ songs: [], artists: [], albums: [] });
  };

  const hasResults = results.songs.length > 0 || results.artists.length > 0 || results.albums.length > 0;
  const showDropdown = searchQuery.length > 0 && !isSearchSubmitted;

  return (
    <div className="relative flex-1 max-w-[400px]">
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
          <button onClick={() => { dispatch(setSearchQuery('')); setResults({ songs: [], artists: [], albums: [] }); }} className="text-[#b3b3b3] hover:text-white mr-2">
            <X size={20} />
          </button>
        )}
        <div className="w-[1px] h-6 bg-[#b3b3b3]/30 mx-2" />
        <button
          onClick={onOpenBrowse}
          className={`ml-2 mr-1 transition-colors ${isBrowsing ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}
          title="Duyệt tìm chuyên mục"
        >
          <Library size={22} className={isBrowsing ? 'fill-white' : ''} />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute top-14 left-0 w-full bg-[#242424] rounded-lg shadow-2xl z-50 p-2 border border-[#333]">
          {isLoadingDropdown && (
            <div className="px-3 py-3 text-sm text-neutral-400">Đang tìm kiếm...</div>
          )}

          {!isLoadingDropdown && !hasResults && (
            <div className="px-3 py-3 text-sm text-neutral-400">Không tìm thấy kết quả</div>
          )}

          {!isLoadingDropdown && hasResults && (
            <>
              {results.songs.length > 0 && (
                <div className="mb-1">
                  <p className="text-xs font-semibold text-neutral-500 uppercase px-3 py-1">Bài hát</p>
                  {results.songs.map((song) => (
                    <div
                      key={song.song_id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[#333] rounded-md cursor-pointer"
                      onClick={() => handleSongClick(song)}
                    >
                      <img src={song.image_url || IMG_FALLBACK} alt={song.title} className="w-8 h-8 rounded object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }} />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{song.title}</p>
                        <p className="text-neutral-400 text-xs truncate">{song.artist_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.artists.length > 0 && (
                <div className="mb-1">
                  <p className="text-xs font-semibold text-neutral-500 uppercase px-3 py-1">Nghệ sĩ</p>
                  {results.artists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[#333] rounded-md cursor-pointer"
                      onClick={() => handleArtistClick(artist)}
                    >
                      <img src={artist.image_url || artist.photo_url || IMG_FALLBACK} alt={artist.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }} />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{artist.name}</p>
                        <p className="text-neutral-400 text-xs">Nghệ sĩ</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.albums.length > 0 && (
                <div className="mb-1">
                  <p className="text-xs font-semibold text-neutral-500 uppercase px-3 py-1">Album</p>
                  {results.albums.map((album) => (
                    <div
                      key={album.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[#333] rounded-md cursor-pointer"
                      onClick={() => handleAlbumClick(album)}
                    >
                      <img src={album.image_url || IMG_FALLBACK} alt={album.title} className="w-8 h-8 rounded object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }} />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{album.title}</p>
                        <p className="text-neutral-400 text-xs truncate">{album.artist_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div
            className="px-3 py-3 mt-1 text-sm font-bold text-white hover:text-green-500 cursor-pointer border-t border-[#333]"
            onClick={() => { dispatch(submitSearch()); setResults({ songs: [], artists: [], albums: [] }); }}
          >
            Xem tất cả kết quả cho "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
}
