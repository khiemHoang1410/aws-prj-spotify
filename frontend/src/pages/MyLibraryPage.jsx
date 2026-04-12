import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Music } from 'lucide-react';
import {
  selectPlaylistIds,
  selectPlaylistsStatus,
  selectPlaylistCache,
  fetchMyPlaylists,
} from '../store/playlistSlice';
import { shouldRefetch } from '../store/playlistUtils';
import PlaylistCard from '../components/playlists/PlaylistCard';
import PlaylistCreateModal from '../components/playlists/PlaylistCreateModal';
import PlaylistRenameModal from '../components/playlists/PlaylistRenameModal';
import PlaylistDeleteConfirm from '../components/playlists/PlaylistDeleteConfirm';
import SkeletonCard from '../components/ui/SkeletonCard';

export default function MyLibraryPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const playlistIds = useSelector(selectPlaylistIds);
  const status = useSelector(selectPlaylistsStatus);
  const cache = useSelector(selectPlaylistCache);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renameId, setRenameId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (shouldRefetch(cache, user?.user_id)) {
      dispatch(fetchMyPlaylists());
    }
  }, [dispatch, cache, user?.user_id]);

  const isLoading = status === 'loading' || status === 'idle';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Thư viện của tôi</h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition text-sm"
        >
          <Plus size={16} />
          Tạo playlist mới
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : playlistIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
            <Music size={36} className="text-neutral-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Hãy bắt đầu hành trình âm nhạc của bạn</h2>
          <p className="text-neutral-400 text-sm mb-6 max-w-xs">
            Tạo playlist đầu tiên để lưu những bài hát yêu thích của bạn.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-neutral-200 transition"
          >
            <Plus size={16} />
            Tạo playlist đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlistIds.map((id) => (
            <PlaylistCard
              key={id}
              playlistId={id}
              onRename={(pid) => setRenameId(pid)}
              onDelete={(pid) => setDeleteId(pid)}
            />
          ))}
        </div>
      )}

      {isCreateOpen && <PlaylistCreateModal onClose={() => setIsCreateOpen(false)} />}
      {renameId && <PlaylistRenameModal playlistId={renameId} onClose={() => setRenameId(null)} />}
      {deleteId && <PlaylistDeleteConfirm playlistId={deleteId} onClose={() => setDeleteId(null)} />}
    </div>
  );
}
