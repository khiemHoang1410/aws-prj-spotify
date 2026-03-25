import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, HeartOff, PlusCircle, ListPlus, EyeOff, Share2, Flag, ChevronRight } from 'lucide-react';
import { toggleLikeSong } from '../../store/authSlice';
import { addToQueue } from '../../store/playerSlice';
import { showToast, openReportModal } from '../../store/uiSlice';
import { getPlaylists, addSongToPlaylist } from '../../services/SongService';

const MENU_WIDTH = 224; // w-56
const MENU_HEIGHT = 290; // approximate height

export default function SongContextMenu({ song, position, onClose }) {
  const dispatch = useDispatch();
  const { likedSongs } = useSelector((state) => state.auth);
  const menuRef = useRef(null);

  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const [playlists, setPlaylists] = useState([]);

  const isLiked = likedSongs.some((s) => s.song_id === song?.song_id);

  // Tính toán vị trí an toàn để tránh tràn viền màn hình
  const safeX = position.x + MENU_WIDTH > window.innerWidth ? position.x - MENU_WIDTH : position.x;
  const safeY = position.y + MENU_HEIGHT > window.innerHeight ? position.y - MENU_HEIGHT : position.y;

  // Click outside → đóng menu
  useEffect(() => {
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Phím Escape → đóng menu
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOpenPlaylistSubmenu = async () => {
    const data = await getPlaylists();
    setPlaylists(data);
    setShowPlaylistSubmenu(true);
  };

  const handleAddToPlaylist = async (pl) => {
    await addSongToPlaylist(pl.id, song);
    dispatch(showToast({ message: `Đã thêm vào "${pl.name}"`, type: 'success' }));
    onClose();
  };

  const handleShare = () => {
    const url = `${window.location.origin}?song=${song.song_id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        dispatch(showToast({ message: 'Đã sao chép link chia sẻ', type: 'success' }));
      }).catch(() => window.prompt('Copy link:', url));
    } else {
      window.prompt('Copy link:', url);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: safeY, left: safeX }}
      className="w-56 bg-[#282828] rounded-md shadow-2xl z-50 p-1 border border-[#3e3e3e]"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Like / Unlike */}
      <button
        className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
        onClick={() => { dispatch(toggleLikeSong(song)); onClose(); }}
      >
        {isLiked ? <HeartOff size={18} /> : <Heart size={18} />}
        {isLiked ? 'Đã thêm vào Bài hát yêu thích' : 'Lưu vào Bài hát yêu thích'}
      </button>

      {/* Thêm vào playlist + submenu */}
      <div className="relative">
        <button
          className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
          onClick={handleOpenPlaylistSubmenu}
        >
          <PlusCircle size={18} />
          <span className="flex-1">Thêm vào playlist</span>
          <ChevronRight size={14} />
        </button>
        {showPlaylistSubmenu && (
          <div className="absolute left-full top-0 w-48 bg-[#282828] rounded-md shadow-2xl z-50 p-1 border border-[#3e3e3e]">
            {playlists.length === 0 ? (
              <p className="px-3 py-2 text-sm text-neutral-500">Chưa có playlist</p>
            ) : (
              playlists.map((pl) => (
                <button
                  key={pl.id}
                  className="w-full text-left px-3 py-2 text-sm text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition truncate"
                  onClick={() => handleAddToPlaylist(pl)}
                >
                  {pl.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add to queue */}
      <button
        className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
        onClick={() => { dispatch(addToQueue(song)); onClose(); }}
      >
        <ListPlus size={18} /> Add to queue
      </button>

      {/* Ẩn bài hát */}
      <button
        className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
        onClick={() => { dispatch(showToast({ message: 'Đã ẩn bài hát này', type: 'info' })); onClose(); }}
      >
        <EyeOff size={18} /> Ẩn bài hát này
      </button>

      <div className="h-[1px] bg-[#3e3e3e] my-1" />

      {/* Chia sẻ */}
      <button
        className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
        onClick={handleShare}
      >
        <Share2 size={18} /> Chia sẻ
      </button>

      {/* Báo cáo */}
      <button
        className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
        onClick={() => { dispatch(openReportModal(song)); onClose(); }}
      >
        <Flag size={18} /> Báo cáo bài hát
      </button>
    </div>
  );
}
