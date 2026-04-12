import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { createPlaylist, selectAllPlaylists } from '../../store/playlistSlice';
import { validatePlaylistName, isDuplicateName } from '../../store/playlistUtils';
import { showToast } from '../../store/uiSlice';

export default function PlaylistCreateModal({ onClose }) {
  const dispatch = useDispatch();
  const playlists = useSelector(selectAllPlaylists);

  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setName(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    const validation = validatePlaylistName(name);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    if (isDuplicateName(playlists, name)) {
      dispatch(showToast({ message: 'Playlist này đã tồn tại', type: 'warning' }));
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await dispatch(createPlaylist(name.trim())).unwrap();
      dispatch(showToast({ message: `Đã tạo "${result.name}"`, type: 'success' }));
      onClose?.();
    } catch {
      dispatch(showToast({ message: 'Không thể tạo playlist', type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#282828] rounded-xl p-6 w-80 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Tạo playlist mới</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Tên playlist..."
          maxLength={80}
          className={`w-full bg-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 mb-1 ${
            error ? 'ring-1 ring-red-500 focus:ring-red-500' : 'focus:ring-green-500'
          }`}
          autoFocus
        />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        {!error && <div className="mb-3" />}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="px-4 py-2 text-sm bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo'}
          </button>
        </div>
      </div>
    </div>
  );
}
