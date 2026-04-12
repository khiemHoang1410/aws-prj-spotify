import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ColorThief from 'colorthief';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

const FALLBACK_GRADIENT = 'linear-gradient(to bottom, #4c1d95, #312e81, #121212)';

function rgbToGradient(rgb) {
  if (!rgb) return FALLBACK_GRADIENT;
  const [r, g, b] = rgb;
  return `linear-gradient(to bottom, rgb(${r},${g},${b}) 0%, rgba(${r},${g},${b},0.6) 40%, #121212 100%)`;
}

export default function SongHero({ song, onColorExtracted }) {
  const imgRef = useRef(null);
  const [dominantColor, setDominantColor] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setDominantColor(null);
    setImgLoaded(false);
  }, [song?.song_id]);

  const handleImageLoad = () => {
    setImgLoaded(true);
    try {
      const colorThief = new ColorThief();
      const color = colorThief.getColor(imgRef.current);
      setDominantColor(color);
      onColorExtracted?.(color);
    } catch {
      // CORS or other error — use fallback gradient
      setDominantColor(null);
    }
  };

  const gradient = dominantColor ? rgbToGradient(dominantColor) : FALLBACK_GRADIENT;

  return (
    <div
      className="relative overflow-hidden rounded-xl mb-0"
      style={{ background: gradient }}
    >
      {/* Blurred background image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={song.image_url || IMG_FALLBACK}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover blur-3xl scale-110 opacity-40"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 pt-10">
        {/* Album art */}
        <div className="flex-shrink-0">
          <img
            ref={imgRef}
            src={song.image_url || IMG_FALLBACK}
            alt={song.title}
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
            className={`w-32 h-32 md:w-48 md:h-48 rounded-xl object-cover shadow-2xl ring-2 ring-white/10
              transition-transform duration-500 ${imgLoaded ? 'scale-100' : 'scale-95'}`}
          />
        </div>

        {/* Info */}
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-2">Bài hát</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
            {song.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-white/80">
            {song.artist_id ? (
              <Link
                to={`/artist/${song.artist_id}`}
                className="font-semibold text-white hover:underline"
              >
                {song.artist_name}
              </Link>
            ) : (
              <span className="font-semibold text-white">{song.artist_name}</span>
            )}
            {song.album_name && (
              <>
                <span className="text-white/40">•</span>
                {song.album_id ? (
                  <Link to={`/album/${song.album_id}`} className="hover:underline">
                    {song.album_name}
                  </Link>
                ) : (
                  <span>{song.album_name}</span>
                )}
              </>
            )}
            {song.play_count > 0 && (
              <>
                <span className="text-white/40">•</span>
                <span>{song.play_count.toLocaleString()} lượt nghe</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
