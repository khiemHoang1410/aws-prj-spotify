import { useState, useEffect, useRef } from 'react';
import { Library, Plus, AudioLines, Heart, X, BadgeCheck, Trash2, Edit3, ListPlus, Clock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../../store/uiSlice';
import { setCurrentSong } from '../../store/playerSlice';
import { openModal } from '../../store/authSlice';
import {
  selectPlaylistIds,
  selectPlaylistsStatus,
  fetchMyPlaylists,
  createPlaylist,
  deletePlaylist,
} from '../../store/playlistSlice';
import { selectPlaylistById } from '../../store/playlistSlice';
import { isLikedPlaylistName } from '../../services/PlaylistService';
import { getFollowedArtists } from '../../services/ArtistService';
import SkeletonCard from '../ui/SkeletonCard';
import SidebarPlaylistItem from '../playlists/SidebarPlaylistItem';

const FILTER_OPTIONS = ['Danh sách phát', 'Nghệ sĩ'];
const MAX_PLAYLIST_NAME_LEN = 80;

// Helper to check system playlist by id from state
function DeleteContextMenu({ playlistId, onDelete, onClose, menuRef, position }) {
  const playlist = useSelector((state) => selectPlaylistById(state, playlistId));
  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[#282828] rounded-md shadow-2xl border border-[#3e3e3e] py-1 w-48 text-sm"
      style={{ top: position.y, left: position.x }}
    >
      <button
        className="w-full text-left px-3 py-2 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-2 transition"
        onClick={() => { onClose(); window.location.href = `/playlist/${playlistId}?mode=add-song`; }}
      >
        <ListPlus size={14} /> Thêm bài hát
      </button>
      <button
        className="w-full text-left px-3 py-2 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-2 transition"
        onClick={() => { onClose(); window.location.href = `/playlist/${playlistId}`; }}
      >
        <Edit3 size={14} /> Chi tiết playlist
      </button>
      <div className="h-[1px] bg-[#3e3e3e] my-1" />
      <button
        className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-[#3e3e3e] flex items-center gap-2 transition"
        onClick={() => onDelete(playlistId, playlist?.name)}
      >
        <Trash2 size={14} /> Xoá playlist
      </button>
    </div>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [filter, setFilter] = useState('Danh sách phát');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [artists, setArtists] = useState([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { playlistId, x, y }
  const contextMenuRef = useRef(null);

  const { isAuthenticated } = useSelector((state) => state.auth);
  const playlistIds = useSelector(selectPlaylistIds);
  const status = useSelector(selectPlaylistsStatus);

  // Lấy 5 bài gần nhất từ historySlice
  const recentEntries = useSelector((s) => s.history?.entries?.slice(0, 5) || []);

  // Fetch playlists when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyPlaylists());
    }
  }, [isAuthenticated, dispatch]);

  // Listen for liked-songs-updated to refresh
  useEffect(() => {
    const handleLikedSongsUpdated = () => {
      if (isAuthenticated) dispatch(fetchMyPlaylists());
    };
    window.addEventListener('liked-songs-updated', handleLikedSongsUpdated);
    return () => window.removeEventListener('liked-songs-updated', handleLikedSongsUpdated);
  }, [isAuthenticated, dispatch]);

  // Click outside closes context menu
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e) => {
      if (contextMenuRef.current?.contains(e.target)) return;
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

  useEffect(() => {
    if (filter !== 'Nghệ sĩ') return;
    setIsLoadingArtists(true);
    getFollowedArtists().then(setArtists).finally(() => setIsLoadingArtists(false));
  }, [filter]);

  const handleCreatePlaylist = async () => {
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) {
      dispatch(showToast({ message: 'Tên playlist không được để trống', type: 'warning' }));
      return;
    }
    if (trimmedName.length > MAX_PLAYLIST_NAME_LEN) {
      dispatch(showToast({ message: `Tên playlist tối đa ${MAX_PLAYLIST_NAME_LEN} ký tự`, type: 'warning' }));
      return;
    }
    setIsCreating(true);
    try {
      const result = await dispatch(createPlaylist(trimmedName)).unwrap();
      dispatch(showToast({ message: `Đã tạo "${result.name}"`, type: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Không thể tạo playlist', type: 'error' }));
    } finally {
      setIsCreating(false);
      setNewPlaylistName('');
      setIsCreateModalOpen(false);
    }
  };

  const handleContextMenu = (e, playlistId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ playlistId, x: e.clientX, y: e.clientY });
  };

  const handleDeletePlaylist = async (playlistId, playlistName) => {
    setContextMenu(null);
    if (isLikedPlaylistName(playlistName || '')) {
      dispatch(showToast({ message: 'Không thể xóa playlist hệ thống', type: 'warning' }));
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xoá playlist "${playlistName}"?`)) return;
    try {
      await dispatch(deletePlaylist(playlistId)).unwrap();
      dispatch(showToast({ message: `Đã xoá "${playlistName}"`, type: 'success' }));
      if (location.pathname === `/playlist/${playlistId}`) navigate('/');
    } catch {
      // Error toast already shown in thunk
    }
  };

  return (
    <nav className="h-full flex flex-col gap-2 p-2">

      {/* Logo */}
      <div
        className="bg-[#121212] rounded-lg p-5 flex items-center gap-3 text-white cursor-pointer hover:text-[#1ed760] transition duration-200"
        onClick={() => navigate('/intro')}
      >
        <AudioLines size={28} />
        <span className="font-bold text-lg tracking-tight">Spotify</span>
      </div>

      {/* Quick links */}
      <div className="bg-[#121212] rounded-lg px-3 py-2 flex flex-col gap-0.5">
        {[
          { label: 'Trang chủ', path: '/', renderIcon: () => <AudioLines size={18} /> },
        ].map(({ label, path, renderIcon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition w-full text-left ${
                isActive ? 'bg-white/10 text-green-400' : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
              }`}
            >
              {renderIcon()}
              {label}
            </button>
          );
        })}
      </div>

      {/* Thư viện */}
      <div className="bg-[#121212] rounded-lg p-2 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 mb-2">
          <button
            className="flex items-center gap-3 text-[#b3b3b3] font-bold hover:text-white transition duration-200"
            onClick={() => isAuthenticated ? navigate('/my-library') : dispatch(openModal('login'))}
          >
            <Library size={24} />
            <span>Thư viện</span>
          </button>
          {isAuthenticated && (
            <button
              className="text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] p-1 rounded-full transition duration-200"
              onClick={() => setIsCreateModalOpen(true)}
              title="Tạo playlist mới"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {/* Khi chưa đăng nhập: hiện CTA, không fetch gì */}
        {!isAuthenticated ? (
          <div className="mx-2 mt-1 flex flex-col gap-2">
            <div className="bg-[#1a1a1a] rounded-lg p-4 flex flex-col gap-3">
              <p className="text-sm font-bold text-white">Tạo playlist đầu tiên của bạn</p>
              <p className="text-xs text-neutral-400">Đăng nhập để tạo và chia sẻ playlist của bạn.</p>
              <button
                onClick={() => dispatch(openModal('login'))}
                className="self-start text-sm font-bold text-black bg-white rounded-full px-4 py-1.5 hover:bg-neutral-200 transition"
              >
                Đăng nhập
              </button>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 flex flex-col gap-3">
              <p className="text-sm font-bold text-white">Theo dõi nghệ sĩ yêu thích</p>
              <p className="text-xs text-neutral-400">Đăng nhập để theo dõi nghệ sĩ và cập nhật nhạc mới.</p>
              <button
                onClick={() => dispatch(openModal('register'))}
                className="self-start text-sm font-bold text-black bg-white rounded-full px-4 py-1.5 hover:bg-neutral-200 transition"
              >
                Đăng ký
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 px-2 mb-3">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                    filter === option ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'
                  }`}
                  onClick={() => setFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {/* Nghệ sĩ */}
          {filter === 'Nghệ sĩ' && (
            isLoadingArtists ? (
              <><SkeletonCard variant="row" /><SkeletonCard variant="row" /><SkeletonCard variant="row" /></>
            ) : artists.length === 0 ? (
              <p className="text-xs text-neutral-500 px-2 py-4">Chưa theo dõi nghệ sĩ nào</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {artists.map((artist) => {
                  const isActive = location.pathname === `/artist/${artist.id}`;
                  return (
                    <div
                      key={artist.id}
                      className={`relative flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition overflow-hidden ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      onClick={() => navigate(`/artist/${artist.id}`)}
                    >
                      {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-green-400 rounded-l" />}
                      <img
                        src={artist.image_url || artist.photo_url}
                        alt={artist.name}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-11 h-11 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-500 items-center justify-center text-white font-bold text-sm hidden">
                        {artist.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>{artist.name}</p>
                          {artist.isVerified && <BadgeCheck size={14} className="text-blue-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-neutral-400">Nghệ sĩ</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Playlists */}
          {filter === 'Danh sách phát' && (
            status === 'loading' ? (
              <><SkeletonCard variant="row" /><SkeletonCard variant="row" /><SkeletonCard variant="row" /></>
            ) : (
              <div className="flex flex-col gap-0.5">
                {/* Mục cố định: Bài hát đã thích */}
                <div
                  className={`relative flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition overflow-hidden ${location.pathname === '/liked-songs' ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  onClick={() => navigate('/liked-songs')}
                >
                  {location.pathname === '/liked-songs' && <div className="absolute left-0 top-0 w-1 h-full bg-green-400 rounded-l" />}
                  <div className="w-11 h-11 rounded flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                    <Heart size={20} className="text-white" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${location.pathname === '/liked-songs' ? 'text-green-400' : 'text-white'}`}>Bài hát đã thích</p>
                    <p className="text-xs text-neutral-400">Danh sách phát</p>
                  </div>
                </div>

                {/* Redux-driven playlist list */}
                {playlistIds.length === 0 && status === 'succeeded' ? (
                  <p className="text-xs text-neutral-500 px-2 py-4">Chưa có playlist nào</p>
                ) : (
                  playlistIds.map((id) => (
                    <div
                      key={id}
                      onContextMenu={(e) => handleContextMenu(e, id)}
                    >
                      <SidebarPlaylistItem playlistId={id} />
                    </div>
                  ))
                )}

                {/* Mục: Nghe gần đây — đặt sau playlist */}
                {recentEntries.length > 0 && (
                  <div className="mt-2">
                    <div className="h-[1px] bg-neutral-800 mb-2" />
                    <div className="flex items-center justify-between px-2 py-1">
                      <button
                        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition ${location.pathname === '/play-history' ? 'text-green-400' : 'text-neutral-400 hover:text-white'}`}
                        onClick={() => navigate('/play-history')}
                      >
                        <Clock size={12} />
                        Nghe gần đây
                      </button>
                      <button
                        className="text-xs text-neutral-500 hover:text-white transition"
                        onClick={() => navigate('/play-history')}
                      >
                        Xem tất cả
                      </button>
                    </div>
                    {recentEntries.map((entry, idx) => (
                      <div
                        key={entry.entryId || idx}
                        className="flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5 transition overflow-hidden"
                        onClick={() => dispatch(setCurrentSong({
                          song_id: entry.songId,
                          title: entry.title,
                          artist_name: entry.artist_name,
                          artist_id: entry.artist_id,
                          image_url: entry.image_url,
                          duration: entry.duration,
                        }))}
                      >
                        <img
                          src={entry.image_url || '/pictures/whiteBackground.jpg'}
                          alt={entry.title}
                          className="w-11 h-11 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{entry.title}</p>
                          <p className="text-xs text-neutral-400 truncate">{entry.artist_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
          </>
        )}
      </div>

      {/* Context menu cho playlist (chuột phải) */}
      {contextMenu && (
        <DeleteContextMenu
          playlistId={contextMenu.playlistId}
          onDelete={handleDeletePlaylist}
          onClose={() => setContextMenu(null)}
          menuRef={contextMenuRef}
          position={{ x: contextMenu.x, y: contextMenu.y }}
        />
      )}

      {/* Modal tạo playlist */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#282828] rounded-xl p-6 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Tạo playlist mới</h3>
              <button
                onClick={() => { setIsCreateModalOpen(false); setNewPlaylistName(''); }}
                className="text-neutral-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              placeholder="Tên playlist..."
              className="w-full bg-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setIsCreateModalOpen(false); setNewPlaylistName(''); }}
                className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || isCreating}
                className="px-4 py-2 text-sm bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
