import { useState, useEffect } from 'react';
import { Play, Plus, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { search } from '../../services/SearchService';
import { followArtist, getArtistTopTracks, getArtistAlbums } from '../../services/ArtistService';
import { setCurrentSong } from '../../store/playerSlice';
import { openModal } from '../../store/authSlice';
import ArtistContextSections from './ArtistContextSections';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

const FILTERS = [
  { id: 'all',       label: 'Tất cả' },
  { id: 'songs',     label: 'Bài hát' },
  { id: 'artists',   label: 'Nghệ sĩ' },
  { id: 'albums',    label: 'Album' },
  { id: 'playlists', label: 'Playlist' },
];

const fmt = (s) => {
  if (!s) return '';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ── Row components ────────────────────────────────────────────────────────────

function SongRow({ song, isPlaying, onPlay }) {
  return (
    <div
      className="flex items-center gap-4 px-3 py-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition"
      onClick={() => onPlay(song)}
    >
      <div className="relative w-12 h-12 flex-shrink-0">
        <img
          src={song.image_url || IMG_FALLBACK}
          alt={song.title}
          className="w-full h-full object-cover rounded"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition">
          <Play fill="white" size={14} className="text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isPlaying ? 'text-[#1DB954]' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-[#b3b3b3] text-xs truncate">Bài hát • {song.artist_name}</p>
      </div>
      <span className="text-[#b3b3b3] text-xs bg-[#2a2a2a] group-hover:bg-[#3a3a3a] px-2 py-0.5 rounded border border-[#3a3a3a] flex-shrink-0 hidden sm:block">
        Bài hát
      </span>
      {song.duration && (
        <span className="text-[#b3b3b3] text-sm tabular-nums flex-shrink-0 w-10 text-right">
          {fmt(song.duration)}
        </span>
      )}
      <button
        className="text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        title="Thêm vào thư viện"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

function AlbumRow({ album, onClick }) {
  return (
    <div
      className="flex items-center gap-4 px-3 py-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition"
      onClick={onClick}
    >
      <img
        src={album.image_url || IMG_FALLBACK}
        alt={album.title}
        className="w-12 h-12 object-cover rounded flex-shrink-0"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{album.title}</p>
        <p className="text-[#b3b3b3] text-xs truncate">Album • {album.artist_name}</p>
      </div>
      <span className="text-[#b3b3b3] text-xs bg-[#2a2a2a] group-hover:bg-[#3a3a3a] px-2 py-0.5 rounded border border-[#3a3a3a] flex-shrink-0 hidden sm:block">
        Album
      </span>
      <button
        className="text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}

function ArtistRow({ artist, followed, onNavigate, onFollow }) {
  return (
    <div
      className="flex items-center gap-4 px-3 py-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition"
      onClick={onNavigate}
    >
      <img
        src={artist.photo_url || artist.image_url || IMG_FALLBACK}
        alt={artist.name}
        className="w-12 h-12 object-cover rounded-full flex-shrink-0"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{artist.name}</p>
        <p className="text-[#b3b3b3] text-xs">Nghệ sĩ</p>
      </div>
      <span className="text-[#b3b3b3] text-xs bg-[#2a2a2a] group-hover:bg-[#3a3a3a] px-2 py-0.5 rounded border border-[#3a3a3a] flex-shrink-0 hidden sm:block">
        Nghệ sĩ
      </span>
      <button
        className="text-[#b3b3b3] hover:text-white opacity-0 group-hover:opacity-100 transition flex-shrink-0 text-xs border border-[#b3b3b3] hover:border-white px-3 py-1 rounded-full"
        onClick={(e) => { e.stopPropagation(); onFollow(e, artist.id); }}
      >
        {followed ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SearchResults({ query }) {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { currentSong, isPlaying } = useSelector((s) => s.player);

  const [results,      setResults]      = useState({ songs: [], artists: [], albums: [] });
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [followedIds,  setFollowedIds]  = useState(new Set());
  const [artistContext, setArtistContext] = useState({
    artist: null, topTracks: [], albums: [], isLoading: false,
  });

  useEffect(() => {
    setActiveFilter('all');
    setArtistContext({ artist: null, topTracks: [], albums: [], isLoading: false });
    if (!query?.trim()) { setResults({ songs: [], artists: [], albums: [] }); return; }
    setIsLoading(true);
    setError(null);
    search(query.trim(), 'all')
      .then((data) => {
        const songs   = data.songs   || [];
        const artists = data.artists || [];
        const albums  = data.albums  || [];
        setResults({ songs, artists, albums });

        // Fetch artist context nếu có top artist match
        const topArtist = artists[0] ?? null;
        if (topArtist) {
          setArtistContext({ artist: topArtist, topTracks: [], albums: [], isLoading: true });
          Promise.all([
            getArtistTopTracks(topArtist.id),
            getArtistAlbums(topArtist.id),
          ]).then(([tracks, artistAlbums]) => {
            setArtistContext({
              artist: topArtist,
              topTracks: tracks,
              albums: artistAlbums,
              isLoading: false,
            });
          }).catch(() => {
            setArtistContext({ artist: topArtist, topTracks: [], albums: [], isLoading: false });
          });
        }
      })
      .catch(() => setError('Không thể tìm kiếm. Vui lòng thử lại.'))
      .finally(() => setIsLoading(false));
  }, [query]);

  const handleFollow = async (e, artistId) => {
    e.stopPropagation();
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    await followArtist(artistId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      next.has(artistId) ? next.delete(artistId) : next.add(artistId);
      return next;
    });
  };

  const handlePlay = (song) => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    dispatch(setCurrentSong(song));
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="flex gap-2 mb-6">
          {FILTERS.map((f) => (
            <div key={f.id} className="h-8 w-20 bg-neutral-800 rounded-full animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-3 py-2 animate-pulse mb-1">
            <div className="w-12 h-12 bg-neutral-800 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-1/3" />
              <div className="h-3 bg-neutral-800 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 text-center">
        <p className="text-neutral-400 text-lg mb-3">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition">
          Thử lại
        </button>
      </div>
    );
  }

  const hasResults = results.songs.length > 0 || results.artists.length > 0 || results.albums.length > 0;

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 text-center">
        <p className="text-neutral-400 text-lg">Không tìm thấy kết quả cho &ldquo;{query}&rdquo;</p>
        <p className="text-neutral-600 text-sm mt-2">Hãy thử tìm kiếm từ khác</p>
      </div>
    );
  }

  const topArtist   = results.artists[0] || null;
  const topSong     = results.songs[0]   || null;
  const topResult   = topArtist || topSong;
  const isTopArtist = !!topArtist;

  return (
    <div className="pb-8">

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              activeFilter === f.id
                ? 'bg-white text-black'
                : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── ALL ── */}
      {activeFilter === 'all' && (
        <>
          {/* Top result banner */}
          {topResult && (
            <div
              className="flex items-center gap-5 bg-[#181818] hover:bg-[#282828] transition rounded-lg p-4 mb-2 cursor-pointer group"
              onClick={() => isTopArtist ? navigate(`/artist/${topArtist.id}`) : handlePlay(topSong)}
            >
              <img
                src={(isTopArtist
                  ? (topArtist.photo_url || topArtist.image_url)
                  : topSong.image_url) || IMG_FALLBACK}
                alt={isTopArtist ? topArtist.name : topSong?.title}
                className={`w-20 h-20 object-cover shadow-2xl flex-shrink-0 ${isTopArtist ? 'rounded-full' : 'rounded'}`}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-2xl font-bold truncate">
                  {isTopArtist ? topArtist.name : topSong?.title}
                </p>
                <p className="text-[#b3b3b3] text-sm mt-0.5">
                  {isTopArtist ? 'Nghệ sĩ' : `Bài hát • ${topSong?.artist_name}`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {isTopArtist && (
                  <button
                    className={`px-5 py-1.5 rounded-full text-sm font-bold border transition ${
                      followedIds.has(topArtist.id)
                        ? 'border-white text-white'
                        : 'border-[#b3b3b3] text-white hover:border-white'
                    }`}
                    onClick={(e) => handleFollow(e, topArtist.id)}
                  >
                    {followedIds.has(topArtist.id) ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                )}
                <button
                  className="w-12 h-12 flex items-center justify-center bg-[#1DB954] text-black rounded-full hover:scale-105 hover:bg-[#1ed760] transition shadow-lg opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    const s = results.songs[0];
                    if (s) handlePlay(s);
                  }}
                >
                  <Play fill="currentColor" size={20} className="ml-0.5" />
                </button>
              </div>
            </div>
          )}

          {/* Artist context: top tracks + albums (chỉ khi có top artist match) */}
          {artistContext.artist && (
            <ArtistContextSections
              artist={artistContext.artist}
              topTracks={artistContext.topTracks}
              albums={artistContext.albums}
              isLoading={artistContext.isLoading}
              currentSongId={currentSong?.song_id}
              isPlaying={isPlaying}
              onPlay={handlePlay}
            />
          )}

          {/* Unified list: songs → albums → extra artists */}
          <div className="flex flex-col">
            {results.songs.map((song) => (
              <SongRow
                key={`s-${song.song_id}`}
                song={song}
                isPlaying={currentSong?.song_id === song.song_id && isPlaying}
                onPlay={handlePlay}
              />
            ))}
            {results.albums.map((album) => (
              <AlbumRow
                key={`a-${album.id}`}
                album={album}
                onClick={() => navigate(`/album/${album.id}`)}
              />
            ))}
            {results.artists.slice(1).map((artist) => (
              <ArtistRow
                key={`ar-${artist.id}`}
                artist={artist}
                followed={followedIds.has(artist.id)}
                onNavigate={() => navigate(`/artist/${artist.id}`)}
                onFollow={handleFollow}
              />
            ))}
          </div>
        </>
      )}

      {/* ── SONGS ── */}
      {activeFilter === 'songs' && (
        <div className="flex flex-col">
          {results.songs.length === 0
            ? <p className="text-neutral-400 text-sm">Không tìm thấy bài hát nào.</p>
            : results.songs.map((song) => (
                <SongRow
                  key={song.song_id}
                  song={song}
                  isPlaying={currentSong?.song_id === song.song_id && isPlaying}
                  onPlay={handlePlay}
                />
              ))
          }
        </div>
      )}

      {/* ── ARTISTS ── */}
      {activeFilter === 'artists' && (
        <div className="flex flex-col">
          {results.artists.length === 0
            ? <p className="text-neutral-400 text-sm">Không tìm thấy nghệ sĩ nào.</p>
            : results.artists.map((artist) => (
                <ArtistRow
                  key={artist.id}
                  artist={artist}
                  followed={followedIds.has(artist.id)}
                  onNavigate={() => navigate(`/artist/${artist.id}`)}
                  onFollow={handleFollow}
                />
              ))
          }
        </div>
      )}

      {/* ── ALBUMS ── */}
      {activeFilter === 'albums' && (
        <div className="flex flex-col">
          {results.albums.length === 0
            ? <p className="text-neutral-400 text-sm">Không tìm thấy album nào.</p>
            : results.albums.map((album) => (
                <AlbumRow
                  key={album.id}
                  album={album}
                  onClick={() => navigate(`/album/${album.id}`)}
                />
              ))
          }
        </div>
      )}

      {/* ── PLAYLISTS ── */}
      {activeFilter === 'playlists' && (
        <div className="flex flex-col">
          <p className="text-neutral-400 text-sm">Không tìm thấy playlist nào.</p>
        </div>
      )}

    </div>
  );
}
