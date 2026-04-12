import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Search, PlusCircle, Check } from 'lucide-react';
import { addSong } from '../../store/playlistSlice';
import { isSongInPlaylist } from '../../store/playlistUtils';
import { searchSongs } from '../../services/SongService';
import { showToast } from '../../store/uiSlice';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export default function AddSongPanel({ playlistId, currentSongs }) {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (term) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    try {
      const data = await searchSongs(term);
      if (!controller.signal.aborted) {
        setResults(Array.isArray(data) ? data.slice(0, 8) : []);
      }
    } catch {
      if (!controller.signal.aborted) setResults([]);
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchTerm.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(searchTerm.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, doSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleAdd = async (song) => {
    if (isSongInPlaylist(currentSongs, song.song_id)) return;
    try {
      await dispatch(addSong({ playlistId, song })).unwrap();
      dispatch(showToast({ message: `Đã thêm "${song.title}" vào playlist`, type: 'success' }));
    } catch {
      // Error toast shown in thunk
    }
  };

  return (
    <div className="mt-8 border-t border-neutral-800 pt-6">
      <h3 className="text-lg font-semibold text-white mb-3">Tìm bài hát để thêm</h3>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm bài hát..."
          className="w-full bg-neutral-800 text-white rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-white"
          autoFocus
        />
      </div>

      {isSearching && (
        <p className="text-sm text-neutral-500 px-4">Đang tìm kiếm...</p>
      )}

      {!isSearching && results.length > 0 && (
        <div className="flex flex-col gap-1">
          {results.map((song) => {
            const alreadyAdded = isSongInPlaylist(currentSongs, song.song_id);
            return (
              <div
                key={song.song_id}
                className="flex items-center justify-between px-4 py-2 rounded-md hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={song.image_url || IMG_FALLBACK}
                    alt={song.title}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                    <p className="text-xs text-neutral-400 truncate">{song.artist_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(song)}
                  disabled={alreadyAdded}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 ${
                    alreadyAdded
                      ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                      : 'border border-neutral-500 text-white hover:border-white hover:bg-white/10'
                  }`}
                >
                  {alreadyAdded ? <Check size={13} /> : <PlusCircle size={13} />}
                  {alreadyAdded ? 'Đã thêm' : 'Thêm'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!isSearching && results.length === 0 && searchTerm.trim().length > 0 && (
        <p className="text-sm text-neutral-500 px-4">Không tìm thấy bài hát nào</p>
      )}
    </div>
  );
}
