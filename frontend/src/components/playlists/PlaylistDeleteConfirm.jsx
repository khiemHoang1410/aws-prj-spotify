import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { deletePlaylist, selectPlaylistById } from '../../store/playlistSlice';
import { canDeletePlaylist } from '../../store/playlistUtils';
import { showToast } from '../../store/uiSlice';

export default function PlaylistDeleteConfirm({ playlistId, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const playlist = useSelector((state) => selectPlaylistById(state, playlistId));
  const [isDeleting, setIsDeleting] = useState(false);

  if (!playlist) return null;

  if (!canDeletePlaylist(playlist)) {
    dispatch(showToast({ message: 'Không thể xóa playlist hệ thống', type: 'warning' }));
    onClose?.();
    return null;
  }

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deletePlaylist(playlistId)).unwrap();
      dispatch(showToast({ message: `Đã xoá "${playlist.name}"`, type: 'success' }));
      onClose?.();
      if (location.pathname === `/playlist/${playlistId}`) {
        navigate('/my-library');
      }
    } catch {
      // Error toast shown in thunk
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#282828] rounded-xl p-6 w-96 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={24} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Xóa playlist</h3>
            <p className="text-neutral-300 text-sm">
              Bạn có chắc muốn xóa playlist <span className="text-white font-semibold">"{playlist.name}"</span>?
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition"
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-full hover:bg-red-400 transition disabled:opacity-50"
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}
