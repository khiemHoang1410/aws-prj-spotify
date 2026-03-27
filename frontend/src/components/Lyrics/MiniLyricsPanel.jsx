import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Maximize2, X } from 'lucide-react';
import { setPiP, setView } from '../../store/uiSlice';

export default function MiniLyricsPanel() {
  const dispatch = useDispatch();
  const { currentSong, currentTime } = useSelector((state) => state.player);
  const lyrics = useLyrics(currentSong?.song_id);

  const currentIndex = lyrics.findIndex((line, i) => {
    const nextTime = lyrics[i + 1]?.time ?? Infinity;
    return currentTime >= line.time && currentTime < nextTime;
  });

  const visibleLines = lyrics.slice(
    Math.max(0, currentIndex - 1),
    currentIndex + 2
  );

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-24 right-4 w-72 rounded-xl z-30 overflow-hidden backdrop-blur-md bg-black/70 shadow-2xl border border-white/10">
      {/* Header: album art + info + controls */}
      <div className="flex items-center gap-3 p-3">
        <img
          src={currentSong.image_url}
          alt="cover"
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{currentSong.title}</p>
          <p className="text-neutral-400 text-xs truncate">{currentSong.artist_name}</p>
        </div>
        <button
          onClick={() => { dispatch(setPiP(false)); dispatch(setView('lyrics')); }}
          className="text-neutral-400 hover:text-white transition"
          title="Mở rộng"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={() => dispatch(setPiP(false))}
          className="text-neutral-400 hover:text-white transition"
          title="Đóng"
        >
          <X size={16} />
        </button>
      </div>

      {/* Lyrics preview */}
      <div className="px-3 pb-3 space-y-1">
        {visibleLines.length > 0 ? (
          visibleLines.map((line, i) => {
            const actualIndex = Math.max(0, currentIndex - 1) + i;
            const isActive = actualIndex === currentIndex;
            return (
              <p
                key={line.time}
                className={`text-xs transition-colors ${isActive ? 'text-white font-semibold' : 'text-neutral-500'}`}
              >
                {line.text}
              </p>
            );
          })
        ) : (
          <p className="text-xs text-neutral-500">Không có lời bài hát</p>
        )}
      </div>
    </div>
  );
}

function useLyrics(songId) {
  const [lyrics, setLyrics] = React.useState([]);

  React.useEffect(() => {
    if (!songId) return;
    import('../../services/api/SongService').then(({ getLyrics }) => {
      getLyrics(songId).then(setLyrics);
    });
  }, [songId]);

  return lyrics;
}
