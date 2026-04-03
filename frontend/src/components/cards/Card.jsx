import React from 'react';
import { Play } from 'lucide-react';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

/**
 * Generic card component — shared layout for songs, playlists, artists.
 *
 * Props:
 *   image       — image URL (falls back to IMG_FALLBACK)
 *   title       — primary text
 *   subtitle    — secondary text
 *   onClick     — card click handler
 *   onPlay      — optional; if provided, shows a play button on hover
 *   imageShape  — "square" (default) | "circle"
 */
export default function Card({ image, title, subtitle, onClick, onPlay, imageShape = 'square' }) {
  const handlePlayClick = (e) => {
    e.stopPropagation();
    onPlay?.();
  };

  return (
    <div
      className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition duration-300 group cursor-pointer flex flex-col"
      onClick={onClick}
    >
      <div className="relative mb-4">
        <img
          src={image || IMG_FALLBACK}
          alt={title}
          className={`w-full aspect-square object-cover shadow-lg ${
            imageShape === 'circle' ? 'rounded-full' : 'rounded'
          }`}
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
        />
        {onPlay && (
          <button
            className="absolute bottom-2 right-2 bg-green-500 text-black rounded-full p-3
                       opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
                       transition-all duration-300 shadow-xl hover:scale-105 hover:bg-green-400"
            onClick={handlePlayClick}
          >
            <Play fill="currentColor" size={24} />
          </button>
        )}
      </div>

      <h3 className="text-white font-bold truncate text-base mb-1">{title}</h3>
      {subtitle && <p className="text-[#b3b3b3] text-sm truncate">{subtitle}</p>}
    </div>
  );
}
