import React, { useState } from 'react';
import Card from './Card';
import SongContextMenu from '../ui/SongContextMenu';

export default function CardSong({ song, onPlay }) {
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0 });

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <Card
        image={song.image_url}
        title={song.title}
        subtitle={song.artist_name || song.artist?.artist_name}
        onClick={() => onPlay(song)}
        onPlay={() => onPlay(song)}
      />
      {contextMenu.isOpen && (
        <SongContextMenu
          song={song}
          position={contextMenu}
          onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
        />
      )}
    </div>
  );
}
