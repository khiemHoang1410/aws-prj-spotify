import React from 'react';
import { useNavigate } from 'react-router-dom';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export default function CardEditorialPlaylist({ playlist }) {
  const navigate = useNavigate();
  const { id, name, coverUrl, songCount } = playlist;

  return (
    <div
      className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition duration-300 cursor-pointer flex flex-col"
      onClick={() => navigate(`/playlists/editorial/${id}`)}
    >
      <div className="relative mb-4">
        <img
          src={coverUrl || IMG_FALLBACK}
          alt={name}
          className="w-full aspect-square object-cover bg-neutral-800 rounded shadow-lg"
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
        />
      </div>

      <h3 className="text-white font-bold truncate text-base mb-1">{name}</h3>
      <p className="text-[#b3b3b3] text-sm truncate">{songCount} bài hát</p>
    </div>
  );
}
