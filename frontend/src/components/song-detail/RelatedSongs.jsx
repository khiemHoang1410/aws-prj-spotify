import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { toSongUrl } from '../../utils/songUrl';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RelatedSongs({ songs, artistName, currentSongId }) {
  const navigate = useNavigate();

  if (!songs || songs.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-bold text-white mb-3">
        Các bài khác của <span className="text-green-400">{artistName}</span>
      </h3>
      <div className="flex flex-col gap-1">
        {songs.map((song) => (
          <div
            key={song.song_id}
            onClick={() => navigate(toSongUrl(song))}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition
              ${song.song_id === currentSongId ? 'bg-white/10' : 'hover:bg-white/5'}`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={song.image_url || IMG_FALLBACK}
                alt={song.title}
                className="w-10 h-10 rounded-md object-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md opacity-0 group-hover:opacity-100 transition">
                <Play size={14} className="text-white fill-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium truncate ${song.song_id === currentSongId ? 'text-green-400' : 'text-white'}`}>
                {song.title}
              </p>
              <p className="text-xs text-neutral-400 truncate">{song.artist_name}</p>
            </div>
            <span className="text-xs text-neutral-500 flex-shrink-0">{formatDuration(song.duration)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
