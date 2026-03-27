import React, { useState, useEffect, useRef } from 'react'; // [S6-002.1]
import { useSelector, useDispatch } from 'react-redux';
import { Play, Heart, Clock, Music, Search, ListPlus, PlusCircle, Check } from 'lucide-react'; // [S6-002.4] [S7-002.1]
import { setCurrentSong } from '../store/playerSlice';
import { openModal, toggleLikeSong } from '../store/authSlice';
import { showToast } from '../store/uiSlice'; // [S6-002.6]
import { getPlaylists, addSongToPlaylist, searchSongs } from '../services/api/SongService';
import EmptyState from '../components/ui/EmptyState';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LikedSongsPage() {
  const dispatch = useDispatch();
  const { likedSongs } = useSelector((state) => state.auth);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // [S6-002.1] Search filter state
  const [searchTerm, setSearchTerm] = useState('');
  // [S6-002.5] Add-to-playlist state
  const [playlists, setPlaylists] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // [S7-002.2] Panel tìm bài hát mới để thích
  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState('');
  const [addSearchResult, setAddSearchResult] = useState([]);

  // [S6-002.1] Filter liked songs by search term
  const filteredSongs = searchTerm.trim()
    ? likedSongs.filter((s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : likedSongs;

  // [S6-002.4] Load playlists for add-to-playlist dropdown
  useEffect(() => {
    getPlaylists().then(setPlaylists);
  }, []);

  // [S7-002.3] Search all songs khi addSearchTerm thay đổi
  useEffect(() => {
    if (addSearchTerm.trim().length < 1) {
      setAddSearchResult([]);
      return;
    }
    const results = searchSongs(addSearchTerm.trim())
      .filter((song) => !likedSongs.some((s) => s.song_id === song.song_id));
    setAddSearchResult(results.slice(0, 8));
  }, [addSearchTerm, likedSongs]);

  // [S6-002.5] Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  const handlePlayAll = () => {
    if (likedSongs.length > 0) handlePlaySong(likedSongs[0]);
  };

  // [S6-002.6] Add song to playlist
  const handleAddToPlaylist = async (playlistId, song) => {
    await addSongToPlaylist(playlistId, song);
    const pl = playlists.find((p) => p.id === playlistId);
    dispatch(showToast({ message: `Đã thêm "${song.title}" vào ${pl?.name || 'playlist'}`, type: 'success' }));
    setOpenDropdownId(null);
  };

  return (
    <div>
      {/* Gradient header */}
      <div className="flex items-end gap-6 h-64 px-2 pb-6 bg-gradient-to-b from-purple-800/60 to-transparent mb-6 -mx-6 -mt-6 px-6">
        <div className="w-44 h-44 rounded-md shadow-2xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0">
          <Heart size={64} className="text-white" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white uppercase mb-1">Danh sách phát</p>
          <h1 className="text-4xl font-extrabold text-white truncate mb-2">Bài hát đã thích</h1>
          <p className="text-sm text-neutral-300">{likedSongs.length} bài hát</p>
        </div>
      </div>

      {/* Action bar — [S7-003.2] Luôn hiện, disable Play khi rỗng */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayAll}
          disabled={likedSongs.length === 0}
          className={`w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg ${
            likedSongs.length === 0
              ? 'bg-green-500/50 cursor-not-allowed'
              : 'hover:bg-green-400 hover:scale-105 transition'
          }`}
        >
          <Play size={24} className="text-black fill-black ml-1" />
        </button>
        {/* [S7-002.4] Nút tìm bài hát để thêm */}
        <button
          onClick={() => setIsAddingSongs((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
            isAddingSongs ? 'bg-white text-black hover:bg-neutral-200' : 'border border-neutral-600 text-neutral-300 hover:border-white hover:text-white'
          }`}
        >
          <Search size={16} />
          Tìm bài hát để thêm
        </button>
      </div>

      {/* [S6-002.2] Search bar */}
      {likedSongs.length > 0 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm trong bài hát đã thích..."
            className="w-full max-w-sm bg-neutral-800 text-white rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-white"
          />
        </div>
      )}

      {/* Song table header — [S6-002.3] thêm cột add-to-playlist */}
      {filteredSongs.length > 0 && (
        <div className="grid grid-cols-[24px_1fr_1fr_80px] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Nghệ sĩ</span>
          <span className="flex justify-center"><Clock size={14} /></span>
        </div>
      )}

      {/* Song rows — [S6-002.3] render filteredSongs */}
      {filteredSongs.length > 0 ? (
        <div className="flex flex-col">
          {filteredSongs.map((song, idx) => (
            <div
              key={song.song_id}
              className="grid grid-cols-[24px_1fr_1fr_80px] gap-4 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition"
              onClick={() => handlePlaySong(song)}
            >
              <span className="text-sm text-neutral-400 flex items-center group-hover:hidden">{idx + 1}</span>
              <Play
                size={16}
                className="text-white hidden group-hover:flex items-center fill-white cursor-pointer"
              />
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={song.image_url}
                  alt={song.title}
                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                />
                <span className="text-sm font-medium text-white truncate">{song.title}</span>
              </div>
              <span className="text-sm text-neutral-400 flex items-center truncate">{song.artist_name}</span>
              <div className="flex items-center justify-center gap-2 relative">
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch(toggleLikeSong(song)); }}
                  className="text-green-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition"
                  title="Bỏ thích"
                >
                  <Heart size={14} fill="currentColor" />
                </button>
                {/* [S6-002.5] Nút thêm vào playlist */}
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === song.song_id ? null : song.song_id); }}
                  className="text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                  title="Thêm vào playlist"
                >
                  <ListPlus size={16} />
                </button>
                <span className="text-sm text-neutral-400">{formatDuration(song.duration)}</span>
                {/* [S6-002.5] Dropdown chọn playlist */}
                {openDropdownId === song.song_id && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-8 w-48 bg-[#282828] rounded-md shadow-2xl z-50 p-1 border border-[#3e3e3e]"
                  >
                    <p className="text-xs text-neutral-400 px-3 py-1.5">Thêm vào playlist</p>
                    {playlists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={(e) => { e.stopPropagation(); handleAddToPlaylist(pl.id, song); }}
                        className="w-full text-left px-3 py-2 text-sm text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition truncate"
                      >
                        {pl.name}
                      </button>
                    ))}
                    {playlists.length === 0 && (
                      <p className="text-xs text-neutral-500 px-3 py-2">Chưa có playlist nào</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState icon={Music} title="Chưa có bài hát yêu thích" description="Hãy nhấn vào biểu tượng trái tim để thêm bài hát vào danh sách." />
        </div>
      )}

      {/* [S7-002.5] Panel tìm bài hát để thích */}
      {isAddingSongs && (
        <div className="mt-8 border-t border-neutral-800 pt-6">
          <h3 className="text-lg font-semibold text-white mb-3">Tìm bài hát để thêm</h3>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={addSearchTerm}
              onChange={(e) => setAddSearchTerm(e.target.value)}
              placeholder="Tìm kiếm bài hát..."
              className="w-full bg-neutral-800 text-white rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-white"
              autoFocus
            />
          </div>
          {addSearchResult.length > 0 ? (
            <div className="flex flex-col gap-1">
              {addSearchResult.map((song) => {
                const isAlreadyLiked = likedSongs.some((s) => s.song_id === song.song_id);
                return (
                  <div
                    key={song.song_id}
                    className="flex items-center justify-between px-4 py-2 rounded-md hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={song.image_url || '/pictures/whiteBackground.jpg'}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{song.title}</p>
                        <p className="text-xs text-neutral-400 truncate">{song.artist_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch(toggleLikeSong(song))}
                      disabled={isAlreadyLiked}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition flex-shrink-0 ${
                        isAlreadyLiked
                          ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                          : 'border border-neutral-500 text-white hover:border-white hover:bg-white/10'
                      }`}
                    >
                      {isAlreadyLiked ? <Check size={13} /> : <Heart size={13} />}
                      {isAlreadyLiked ? 'Đã thích' : 'Thích'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : addSearchTerm.trim().length > 0 ? (
            <p className="text-sm text-neutral-500 px-4">Không tìm thấy bài hát nào</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
