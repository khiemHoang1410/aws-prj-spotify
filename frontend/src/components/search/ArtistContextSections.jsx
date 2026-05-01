import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';

const IMG_FALLBACK = '/pictures/artworkDefault.png';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ArtistContextSkeleton() {
  return (
    <div className="mb-6 animate-pulse">
      {/* Top tracks skeleton */}
      <div className="h-5 w-48 bg-neutral-800 rounded mb-3" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-4 h-4 bg-neutral-800 rounded flex-shrink-0" />
          <div className="w-10 h-10 bg-neutral-800 rounded flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-neutral-800 rounded w-1/3" />
            <div className="h-3 bg-neutral-800 rounded w-1/4" />
          </div>
        </div>
      ))}
      {/* Albums skeleton */}
      <div className="h-5 w-36 bg-neutral-800 rounded mt-5 mb-3" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-neutral-800 rounded-md p-3">
            <div className="w-full aspect-square bg-neutral-700 rounded mb-2" />
            <div className="h-3.5 bg-neutral-700 rounded w-3/4 mb-1" />
            <div className="h-3 bg-neutral-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top Tracks Section ────────────────────────────────────────────────────────

function fmt(s) {
  if (!s) return '';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function ArtistTopTracksSection({ artist, tracks, currentSongId, isPlaying, onPlay }) {
  return (
    <div className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">
        Bài hát phổ biến của {artist.name}
      </h3>
      <div className="flex flex-col">
        {tracks.map((song, index) => {
          const active = currentSongId === song.song_id && isPlaying;
          return (
            <div
              key={song.song_id}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition"
              onClick={() => onPlay(song)}
            >
              {/* Index number */}
              <span className="text-[#b3b3b3] text-sm w-4 text-right flex-shrink-0 group-hover:hidden">
                {index + 1}
              </span>
              <span className="text-[#b3b3b3] hidden group-hover:flex w-4 flex-shrink-0 items-center justify-center">
                <Play fill="white" size={12} className="text-white" />
              </span>
              {/* Cover */}
              <img
                src={song.image_url || IMG_FALLBACK}
                alt={song.title}
                className="w-10 h-10 object-cover rounded flex-shrink-0"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
              />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${active ? 'text-[#1DB954]' : 'text-white'}`}>
                  {song.title}
                </p>
                <p className="text-[#b3b3b3] text-xs truncate">{song.artist_name}</p>
              </div>
              {/* Duration */}
              {song.duration && (
                <span className="text-[#b3b3b3] text-xs tabular-nums flex-shrink-0 w-10 text-right">
                  {fmt(song.duration)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Albums Section ────────────────────────────────────────────────────────────

function ArtistAlbumsSection({ artist, albums }) {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      <h3 className="text-white font-bold text-lg mb-3">
        Album của {artist.name}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {albums.map((album) => (
          <div
            key={album.id}
            className="bg-[#181818] p-3 rounded-md hover:bg-[#282828] transition cursor-pointer group"
            onClick={() => navigate(`/album/${album.id}`)}
          >
            <div className="relative mb-2">
              <img
                src={album.image_url || IMG_FALLBACK}
                alt={album.title}
                className="w-full aspect-square object-cover rounded"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition">
                <Play fill="white" size={20} className="text-white" />
              </div>
            </div>
            <p className="text-white text-sm font-semibold truncate">{album.title}</p>
            <p className="text-[#b3b3b3] text-xs mt-0.5">
              {album.release_date ? new Date(album.release_date).getFullYear() : 'Album'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Container ─────────────────────────────────────────────────────────────────

/**
 * ArtistContextSections
 * Hiển thị "Bài hát phổ biến" và "Album" của top artist match trong search results.
 * Chỉ render khi activeFilter === 'all' và artist != null.
 *
 * Props:
 *   artist       — AdaptedArtist (top search match)
 *   topTracks    — AdaptedSong[]
 *   albums       — AdaptedAlbum[]
 *   isLoading    — boolean
 *   currentSongId — string | null (from player state)
 *   isPlaying    — boolean (from player state)
 *   onPlay       — (song: AdaptedSong) => void
 */
export default function ArtistContextSections({
  artist,
  topTracks,
  albums,
  isLoading,
  currentSongId,
  isPlaying,
  onPlay,
}) {
  if (isLoading) return <ArtistContextSkeleton />;
  if (!topTracks.length && !albums.length) return null;

  return (
    <div className="mb-2">
      {topTracks.length > 0 && (
        <ArtistTopTracksSection
          artist={artist}
          tracks={topTracks.slice(0, 5)}
          currentSongId={currentSongId}
          isPlaying={isPlaying}
          onPlay={onPlay}
        />
      )}
      {albums.length > 0 && (
        <ArtistAlbumsSection artist={artist} albums={albums} />
      )}
    </div>
  );
}
