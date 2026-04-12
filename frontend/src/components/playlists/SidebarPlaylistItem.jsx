import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { selectPlaylistById, selectPlaylistCover } from '../../store/playlistSlice';

const PLAYLIST_DEFAULT_IMG = '/pictures/playlistDefault.jpg';

const SidebarPlaylistItem = React.memo(({ playlistId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const playlist = useSelector((state) => selectPlaylistById(state, playlistId));
  const cover = useSelector((state) => selectPlaylistCover(state, playlistId));

  if (!playlist) return null;

  const isActive = location.pathname === `/playlist/${playlistId}`;
  const imgSrc = cover || playlist.image_url || PLAYLIST_DEFAULT_IMG;

  return (
    <div
      className={`relative flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition overflow-hidden ${
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onClick={() => navigate(`/playlist/${playlistId}`)}
    >
      {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-green-400 rounded-l" />}
      <img
        src={imgSrc}
        alt={playlist.name}
        className="w-11 h-11 rounded object-cover flex-shrink-0"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLAYLIST_DEFAULT_IMG; }}
      />
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-green-400' : 'text-white'}`}>
          {playlist.name}
        </p>
        <p className="text-xs text-neutral-400 truncate">
          Danh sách phát • {playlist.owner}
        </p>
      </div>
    </div>
  );
});

SidebarPlaylistItem.displayName = 'SidebarPlaylistItem';

export default SidebarPlaylistItem;
