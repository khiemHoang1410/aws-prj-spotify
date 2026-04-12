import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Play, Pause, Heart, MoreHorizontal, Music, MessageCircle, Info, ArrowLeft } from 'lucide-react';

import { parseSongId } from '../utils/songUrl';
import { getSongById, getLyrics, getSongs } from '../services/SongService';
import { setCurrentSong, togglePlay } from '../store/playerSlice';
import { toggleLikeSongThunk, openModal } from '../store/authSlice';
import { showToast } from '../store/uiSlice';

import SongHero from '../components/song-detail/SongHero';
import LyricsSection from '../components/song-detail/LyricsSection';
import RelatedSongs from '../components/song-detail/RelatedSongs';
import SongContextMenu from '../components/ui/SongContextMenu';
import SkeletonCard from '../components/ui/SkeletonCard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export function filterRelatedSongs(allSongs, currentSong) {
  return allSongs
    .filter((s) => s.song_id !== currentSong.song_id)
    .filter((s) =>
      (currentSong.artist_id && s.artist_id === currentSong.artist_id) ||
      (currentSong.categories?.length > 0 &&
        s.categories?.some((c) => currentSong.categories.includes(c)))
    )
    .slice(0, 10);
}

const TABS = [
  { id: 'lyrics', label: 'Lời bài hát', icon: Music },
  { id: 'comments', label: 'Bình luận', icon: MessageCircle },
  { id: 'info', label: 'Thông tin', icon: Info },
];

export default function SongDetailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { songSlug } = useParams();

  const { currentSong: reduxSong, currentTime, isPlaying } = useSelector((s) => s.player);
  const { isAuthenticated, likedSongs } = useSelector((s) => s.auth);

  const songId = parseSongId(songSlug);
  const isValidUUID = UUID_REGEX.test(songId);

  // Zero-wait: use Redux data immediately if it matches
  const initialSong = reduxSong?.song_id === songId ? reduxSong : null;

  const [song, setSong] = useState(initialSong);
  const [lyrics, setLyrics] = useState([]);
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(!initialSong);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('lyrics');
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0 });
  const [dominantColor, setDominantColor] = useState(null);
  const [isSticky, setIsSticky] = useState(false);

  const actionBarRef = useRef(null);
  const heroRef = useRef(null);

  // Validate UUID
  useEffect(() => {
    if (!isValidUUID) {
      setNotFound(true);
      setIsLoading(false);
    }
  }, [isValidUUID]);

  // Fetch song + lyrics
  useEffect(() => {
    if (!isValidUUID) return;

    let cancelled = false;

    const fetchData = async () => {
      if (!initialSong) setIsLoading(true);

      try {
        const [songData, lyricsData] = await Promise.all([
          getSongById(songId),
          getLyrics(songId),
        ]);

        if (cancelled) return;

        if (!songData) {
          setNotFound(true);
        } else {
          setSong(songData);
          setLyrics(lyricsData || []);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [songId, isValidUUID]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch related songs after we have song data
  useEffect(() => {
    if (!song?.artist_id && !song?.categories?.length) return;
    getSongs().then((all) => {
      setRelatedSongs(filterRelatedSongs(all, song));
    }).catch(() => {});
  }, [song?.song_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // document.title
  useEffect(() => {
    if (song) {
      document.title = `${song.title} - ${song.artist_name}`;
    }
    return () => { document.title = 'Music App'; };
  }, [song?.title, song?.artist_name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sticky action bar on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setIsSticky(heroBottom < 64);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isCurrentSong = reduxSong?.song_id === songId;
  const isLiked = likedSongs.some((s) => s.song_id === songId);

  const handlePlay = () => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    navigator.vibrate?.(10);
    if (isCurrentSong) {
      dispatch(togglePlay());
    } else {
      dispatch(setCurrentSong(song));
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    navigator.vibrate?.(10);
    dispatch(toggleLikeSongThunk(song));
  };

  const handleContextMenuOpen = (e) => {
    e.preventDefault();
    setContextMenu({ open: true, x: e.clientX, y: e.clientY });
  };

  if (!isValidUUID || notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Music size={48} className="text-neutral-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Bài hát không tồn tại</h2>
        <p className="text-neutral-400 mb-6">Link có thể đã hết hạn hoặc bài hát đã bị xóa.</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>
    );
  }

  if (isLoading && !song) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-xl bg-neutral-800 animate-pulse" />
        <div className="space-y-3 mt-4">
          <SkeletonCard variant="row" />
          <SkeletonCard variant="row" />
          <SkeletonCard variant="row" />
        </div>
      </div>
    );
  }

  if (!song) return null;

  return (
    <div className="pb-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition text-sm"
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      {/* Hero */}
      <div ref={heroRef}>
        <SongHero song={song} onColorExtracted={setDominantColor} />
      </div>

      {/* Action Bar */}
      <div
        ref={actionBarRef}
        className={`flex items-center gap-4 py-4 px-2 transition-all z-20
          ${isSticky
            ? 'sticky top-0 bg-[#121212]/80 backdrop-blur-md border-b border-white/5 -mx-6 px-6'
            : 'mt-4'
          }`}
      >
        {/* Play */}
        <button
          onClick={handlePlay}
          className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition shadow-lg"
          aria-label={isCurrentSong && isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isCurrentSong && isPlaying
            ? <Pause size={22} className="text-black fill-black" />
            : <Play size={22} className="text-black fill-black ml-0.5" />
          }
        </button>

        {/* Like */}
        <button
          onClick={handleLike}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition
            ${isLiked ? 'text-green-400' : 'text-neutral-400 hover:text-white'}`}
          aria-label={isLiked ? 'Bỏ thích' : 'Thích'}
        >
          <Heart size={22} className={isLiked ? 'fill-green-400' : ''} />
        </button>

        {/* Context menu */}
        <button
          onClick={handleContextMenuOpen}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition"
          aria-label="Tùy chọn"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Context menu portal */}
      {contextMenu.open && (
        <SongContextMenu
          song={song}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu({ open: false, x: 0, y: 0 })}
        />
      )}

      {/* Main layout: tabs + related */}
      <div className="flex flex-col lg:flex-row gap-6 mt-2">
        {/* Tabs */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-1 mb-4 border-b border-white/10 scrollbar-none">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap transition
                  ${activeTab === id
                    ? 'text-white border-b-2 border-green-400'
                    : 'text-neutral-400 hover:text-white'
                  }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="backdrop-blur-sm bg-white/[0.02] rounded-xl p-4 min-h-[200px]">
            {activeTab === 'lyrics' && (
              <LyricsSection
                lyrics={lyrics}
                currentTime={isCurrentSong ? currentTime : 0}
                duration={song.duration}
              />
            )}

            {activeTab === 'comments' && <CommentsPlaceholder />}

            {activeTab === 'info' && <CreditsTab song={song} />}
          </div>
        </div>

        {/* Related songs sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <RelatedSongs
            songs={relatedSongs}
            artistName={song.artist_name}
            currentSongId={songId}
          />
        </div>
      </div>
    </div>
  );
}

function CommentsPlaceholder() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
          Sắp ra mắt
        </span>
        <span className="text-sm text-neutral-400">Tính năng bình luận đang được phát triển</span>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 opacity-40">
            <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-neutral-700 rounded animate-pulse w-24" />
              <div className="h-3 bg-neutral-700 rounded animate-pulse w-full" />
              <div className="h-3 bg-neutral-700 rounded animate-pulse w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreditsTab({ song }) {
  return (
    <div className="space-y-4 text-sm">
      {song.artist_id && (
        <div className="flex items-start gap-3">
          <span className="text-neutral-500 w-28 flex-shrink-0">Nghệ sĩ</span>
          <Link to={`/artist/${song.artist_id}`} className="text-white hover:underline font-medium">
            {song.artist_name}
          </Link>
        </div>
      )}

      {song.album_name && (
        <div className="flex items-start gap-3">
          <span className="text-neutral-500 w-28 flex-shrink-0">Album</span>
          {song.album_id ? (
            <Link to={`/album/${song.album_id}`} className="text-white hover:underline font-medium">
              {song.album_name}
            </Link>
          ) : (
            <span className="text-white font-medium">{song.album_name}</span>
          )}
        </div>
      )}

      {song.created_at && (
        <div className="flex items-start gap-3">
          <span className="text-neutral-500 w-28 flex-shrink-0">Phát hành</span>
          <span className="text-white">
            {new Date(song.created_at).toLocaleDateString('vi-VN', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
        </div>
      )}

      {song.categories?.length > 0 && (
        <div className="flex items-start gap-3">
          <span className="text-neutral-500 w-28 flex-shrink-0">Thể loại</span>
          <div className="flex flex-wrap gap-2">
            {song.categories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-white/10">
        <p className="text-neutral-600 text-xs">Cung cấp bởi Music App</p>
      </div>
    </div>
  );
}
