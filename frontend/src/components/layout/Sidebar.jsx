import { useState, useEffect } from 'react';
import { Library, Plus, AudioLines, Heart, X, BadgeCheck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../../store/uiSlice';
import { getPlaylists, createPlaylist } from '../../services/SongService';
import { getFollowedArtists } from '../../services/ArtistService';
import SkeletonCard from '../ui/SkeletonCard';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';
const FILTER_OPTIONS = ['Danh sách phát', 'Nghệ sĩ'];

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { likedSongs } = useSelector((state) => state.auth);

  const [filter, setFilter] = useState('Danh sách phát');
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [artists, setArtists] = useState([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getPlaylists().then(setPlaylists).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (filter !== 'Nghệ sĩ') return;
    setIsLoadingArtists(true);
    getFollowedArtists().then(setArtists).finally(() => setIsLoadingArtists(false));
  }, [filter]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setIsCreating(true);
    try {
      const playlist = await createPlaylist({ name: newPlaylistName.trim(), owner: 'Bạn' });
      setPlaylists((prev) => [...prev, playlist]);
      dispatch(showToast({ message: `Đã tạo "${playlist.name}"`, type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Không thể tạo playlist', type: 'error' }));
    }
    setIsCreating(false);
    setNewPlaylistName('');
    setIsCreateModalOpen(false);
  };

  return (
    <nav className="h-full flex flex-col gap-2 p-2">

      {/* Logo */}
      <div className="bg-[#121212] rounded-lg p-5 flex items-center gap-3 text-white cursor-pointer hover:text-[#1ed760] transition duration-200"
        onClick={() => navigate('/intro')}>
        <AudioLines size={28} />
        <span className="font-bold text-lg tracking-tight">Spotify</span>
      </div>

      {/* Thư viện */}
      <div className="bg-[#121212] rounded-lg p-2 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 mb-2">
          <button className="flex items-center gap-3 text-[#b3b3b3] font-bold hover:text-white transition duration-200">
            <Library size={24} />
            <span>Thư viện</span>
          </button>
          <button className="text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] p-1 rounded-full transition duration-200"
            onClick={() => setIsCreateModalOpen(true)} title="Tạo playlist mới">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex gap-2 px-2 mb-3">
          {FILTER_OPTIONS.map((option) => (
            <button key={option}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${filter === option ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
              onClick={() => setFilter(option)}>
              {option}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {/* Bài hát đã thích */}
          <div className={`flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer mb-1 transition ${location.pathname === '/liked' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            onClick={() => navigate('/liked')}>
            <div className="w-11 h-11 rounded bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Heart size={18} className="text-white" fill="currentColor" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Bài hát đã thích</p>
              <p className="text-xs text-neutral-400 truncate">Danh sách phát • {likedSongs.length} bài hát</p>
            </div>
          </div>

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
                    <div key={artist.id}
                      className={`relative flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition overflow-hidden ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      onClick={() => navigate(`/artist/${artist.id}`)}>
                      {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-green-400 rounded-l" />}
                      <img src={artist.image_url || artist.photo_url} alt={artist.name}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }} />
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
            isLoading ? (
              <><SkeletonCard variant="row" /><SkeletonCard variant="row" /><SkeletonCard variant="row" /></>
            ) : (
              <div className="flex flex-col gap-0.5">
                {playlists.map((playlist) => {
                  const isActive = location.pathname === `/playlist/${playlist.id}`;
                  return (
                    <div key={playlist.id}
                      className={`relative flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition overflow-hidden ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      onClick={() => navigate(`/playlist/${playlist.id}`)}>
                      {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-green-400 rounded-l" />}
                      <img src={playlist.image_url} alt={playlist.name}
                        className="w-11 h-11 rounded object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }} />
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>{playlist.name}</p>
                        <p className="text-xs text-neutral-400 truncate">Danh sách phát • {playlist.owner}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal tạo playlist */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#282828] rounded-xl p-6 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Tạo playlist mới</h3>
              <button onClick={() => { setIsCreateModalOpen(false); setNewPlaylistName(''); }} className="text-neutral-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              placeholder="Tên playlist..."
              className="w-full bg-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500 mb-4"
              autoFocus />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setIsCreateModalOpen(false); setNewPlaylistName(''); }} className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition">Huỷ</button>
              <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim() || isCreating}
                className="px-4 py-2 text-sm bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {isCreating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
