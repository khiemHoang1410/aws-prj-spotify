import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { X, Search, Trash2, Plus, Music } from 'lucide-react';
import {
  getEditorialPlaylist,
  getSongs,
  addSongToEditorialPlaylist,
  removeSongFromEditorialPlaylist,
} from '../../services/AdminService';
import { showToast } from '../../store/uiSlice';

/**
 * EditorialSongManager — modal for managing songs in an editorial playlist.
 *
 * Props:
 * - playlistId: string — the editorial playlist to manage
 * - onClose(): called when the modal should be dismissed
 */
export default function EditorialSongManager({ playlistId, onClose }) {
  const dispatch = useDispatch();

  const [playlist, setPlaylist] = useState(null);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [actionInProgress, setActionInProgress] = useState(null); // songId being acted on

  const debounceRef = useRef(null);

  // Fetch current playlist songs on mount
  useEffect(() => {
    setLoadingPlaylist(true);
    getEditorialPlaylist(playlistId)
      .then((data) => setPlaylist(data))
      .catch(() => dispatch(showToast({ message: 'Không thể tải playlist', type: 'error' })))
      .finally(() => setLoadingPlaylist(false));
  }, [playlistId, dispatch]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await getSongs({ search: searchTerm.trim() });
        setSearchResults(result?.items ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  const handleAddSong = async (song) => {
    setActionInProgress(song.id);
    try {
      await addSongToEditorialPlaylist(playlistId, song.id);
      setPlaylist((prev) => ({
        ...prev,
        songs: [...(prev.songs ?? []), song],
      }));
      dispatch(showToast({ message: `Đã thêm "${song.title}" vào playlist`, type: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Không thể thêm bài hát', type: 'error' }));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRemoveSong = async (song) => {
    setActionInProgress(song.id);
    try {
      await removeSongFromEditorialPlaylist(playlistId, song.id);
      setPlaylist((prev) => ({
        ...prev,
        songs: prev.songs.filter((s) => s.id !== song.id),
      }));
      dispatch(showToast({ message: `Đã xóa "${song.title}" khỏi playlist`, type: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Không thể xóa bài hát', type: 'error' }));
    } finally {
      setActionInProgress(null);
    }
  };

  const currentSongIds = new Set((playlist?.songs ?? []).map((s) => s.id));

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">Quản lý bài hát</h2>
            {playlist && (
              <p className="text-sm text-neutral-400 mt-0.5">{playlist.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-0 overflow-hidden flex-1">
          {/* Current songs */}
          <div className="flex-1 overflow-y-auto px-6 py-4 border-b border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide mb-3">
              Bài hát hiện tại
            </h3>

            {loadingPlaylist ? (
              <div className="flex items-center justify-center py-8 text-neutral-500 text-sm">
                Đang tải...
              </div>
            ) : !playlist?.songs?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-500 gap-2">
                <Music size={32} className="opacity-40" />
                <p className="text-sm">Playlist chưa có bài hát nào</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {playlist.songs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-800 transition group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{song.title}</p>
                      <p className="text-xs text-neutral-400 truncate">{song.artistName}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveSong(song)}
                      disabled={actionInProgress === song.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0 ml-3"
                    >
                      <Trash2 size={13} />
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search to add */}
          <div className="px-6 py-4 flex-shrink-0">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide mb-3">
              Thêm bài hát
            </h3>
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bài hát..."
                className="w-full bg-neutral-800 border border-neutral-600 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition placeholder-neutral-500"
              />
            </div>

            {searching && (
              <p className="text-sm text-neutral-500 px-1">Đang tìm kiếm...</p>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {searchResults.map((song) => {
                  const alreadyAdded = currentSongIds.has(song.id);
                  return (
                    <div
                      key={song.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-neutral-800 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{song.title}</p>
                        <p className="text-xs text-neutral-400 truncate">{song.artistName}</p>
                      </div>
                      <button
                        onClick={() => !alreadyAdded && handleAddSong(song)}
                        disabled={alreadyAdded || actionInProgress === song.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition flex-shrink-0 ml-3 ${
                          alreadyAdded
                            ? 'text-neutral-500 cursor-not-allowed'
                            : 'text-green-400 hover:text-green-300 hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        <Plus size={13} />
                        {alreadyAdded ? 'Đã thêm' : 'Thêm'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {!searching && searchTerm.trim() && searchResults.length === 0 && (
              <p className="text-sm text-neutral-500 px-1">Không tìm thấy bài hát nào</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-neutral-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-600 rounded-lg hover:bg-neutral-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
