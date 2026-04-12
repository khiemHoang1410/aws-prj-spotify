import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Globe, Lock, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { selectPlaylistById, selectPlaylistCover, selectPlaylistSongs } from '../../store/playlistSlice';

const PLAYLIST_DEFAULT_IMG = '/pictures/playlistDefault.jpg';

export default function PlaylistCard({ playlistId, onRename, onDelete }) {
  const navigate = useNavigate();
  const playlist = useSelector((state) => selectPlaylistById(state, playlistId));
  const cover = useSelector((state) => selectPlaylistCover(state, playlistId));
  const songs = useSelector((state) => selectPlaylistSongs(state, playlistId));

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  if (!playlist) return null;

  const imgSrc = cover || playlist.image_url || PLAYLIST_DEFAULT_IMG;
  const songCount = songs.length;

  return (
    <div
      className="group relative bg-[#181818] hover:bg-[#282828] rounded-lg p-4 cursor-pointer transition-colors"
      onClick={() => navigate(`/playlist/${playlistId}`)}
    >
      {/* Cover */}
      <div className="relative mb-4">
        <img
          src={imgSrc}
          alt={playlist.name}
          className="w-full aspect-square object-cover rounded-md shadow-lg"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLAYLIST_DEFAULT_IMG; }}
        />
      </div>

      {/* Info */}
      <p className="text-white font-semibold text-sm truncate mb-1">{playlist.name}</p>
      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
        <span>{songCount} bài hát</span>
        <span>•</span>
        {playlist.is_public
          ? <span className="flex items-center gap-0.5"><Globe size={10} /> Công khai</span>
          : <span className="flex items-center gap-0.5"><Lock size={10} /> Riêng tư</span>
        }
      </div>

      {/* Context menu button */}
      <button
        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
        onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
        title="Tùy chọn"
      >
        <MoreHorizontal size={16} />
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-10 right-3 z-50 bg-[#282828] rounded-md shadow-2xl border border-[#3e3e3e] py-1 w-44 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] flex items-center gap-2 transition"
            onClick={() => { setMenuOpen(false); onRename?.(playlistId); }}
          >
            <Edit3 size={14} /> Đổi tên
          </button>
          <button
            className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-[#3e3e3e] flex items-center gap-2 transition"
            onClick={() => { setMenuOpen(false); onDelete?.(playlistId); }}
          >
            <Trash2 size={14} /> Xóa playlist
          </button>
        </div>
      )}
    </div>
  );
}
