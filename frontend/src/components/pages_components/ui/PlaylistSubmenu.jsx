"use client";
import { useEffect, useRef, forwardRef } from "react";
import { Plus } from "lucide-react";

const PlaylistSubmenu = forwardRef(
  ({ isOpen, onClose, position, song, playlists, addToPlaylist, createNewPlaylist }, ref) => {
    const innerRef = useRef(null);
    const submenuRef = ref || innerRef;

    useEffect(() => {
      if (isOpen && submenuRef.current) {
        const submenuRect = submenuRef.current.getBoundingClientRect();
        const adjustedPosition = { ...position };

        if (position.left + submenuRect.width > window.innerWidth) {
          adjustedPosition.left = position.left - submenuRect.width - 10;
        }

        if (position.top + submenuRect.height > window.innerHeight + window.scrollY) {
          const overflow = position.top + submenuRect.height - (window.innerHeight + window.scrollY);
          adjustedPosition.top = position.top - overflow - 10;

          if (adjustedPosition.top < window.scrollY) {
            adjustedPosition.top = window.scrollY + 10;
          }
        }

        if (adjustedPosition.left !== position.left || adjustedPosition.top !== position.top) {
          submenuRef.current.style.top = `${adjustedPosition.top}px`;
          submenuRef.current.style.left = `${adjustedPosition.left}px`;
        }
      }
    }, [isOpen, position, submenuRef]);

    if (!isOpen) return null;

    return (
      <div
        className="playlist-submenu"
        ref={submenuRef}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="playlist-search">
          <input
            type="text"
            placeholder="Tìm playlist"
            className="playlist-search-input"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {playlists.length > 0 ? (
          <div className="playlist-list">
            {playlists.map((playlist) => (
              <button
                key={playlist.user_playlist_id || playlist.id}
                className="playlist-item"
                onClick={(e) => addToPlaylist(song, playlist.user_playlist_id || playlist.id, e)}
              >
                {playlist.playlist_name || "Unnamed Playlist"}
              </button>
            ))}
          </div>
        ) : (
          <div className="playlist-empty">Chưa có playlist</div>
        )}

        <button className="create-playlist" onClick={(e) => createNewPlaylist(song, e)}>
          <Plus size={14} />
          <span>Tạo playlist mới</span>
        </button>
      </div>
    );
  }
);

PlaylistSubmenu.displayName = "PlaylistSubmenu";

export default PlaylistSubmenu;