import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getLyrics } from '../../services/SongService';
import { getMyPlaylists, addSongToPlaylist } from '../../services/PlaylistService';
import { getArtistInfo, followArtist } from '../../services/ArtistService';
import { setPiP, openReportModal, showToast } from '../../store/uiSlice';
import { toggleLikeSongThunk, toggleFollowArtist } from '../../store/authSlice';
import { addToQueue } from '../../store/playerSlice';
import { adjustLyricsOffset, resetLyricsOffset } from '../../store/playerSlice';
import { Disc, PlayCircle, UserSquare2, Mic2, MoreHorizontal, Maximize, PictureInPicture2, PlusCircle, Heart, HeartOff, ListPlus, EyeOff, Share2, Flag, Minimize, BadgeCheck, ExternalLink, Music2, Minus, Plus, RotateCcw } from 'lucide-react';

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};

// Import các component con vừa tạo
import LyricsMode from './LyricsMode';
import BottomInfo from './BottomInfo';
import VideoPlayer from '../VideoPlayer';
import { parseLrc, normalizeLyrics } from '../../utils/lrcParser';

const waitForFullscreenExit = () => new Promise((resolve) => {
  if (!document.fullscreenElement) {
    resolve();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    resolve();
  };

  const onFullscreenChange = () => {
    if (!document.fullscreenElement) finish();
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);
  setTimeout(finish, 400);
});

const minimizeToPiP = async (dispatch, navigate) => {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
      await waitForFullscreenExit();
    } catch {
      // Ignore lỗi thoát fullscreen để không chặn luồng PiP
    }
  }
  dispatch(setPiP(true));
  navigate(-1);
};

// ─── ArtistInfoPanel ───────────────────────────────────────────────────────────
function ArtistInfoPanel({ song }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { followedArtists } = useSelector((state) => state.auth);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!song?.artist_name) return;
    setLoading(true);
    getArtistInfo(song.artist_name)
      .then(setArtist)
      .finally(() => setLoading(false));
  }, [song?.artist_name]);

  const artistId = artist?.id || null;
  const isFollowing = Array.isArray(followedArtists) && artistId
    ? followedArtists.includes(artistId)
    : false;

  const handleFollow = async () => {
    if (!artistId) return;
    dispatch(toggleFollowArtist(artistId));
    const res = await followArtist(artistId);
    if (res?.success === false) {
      dispatch(toggleFollowArtist(artistId));
      dispatch(showToast({ message: 'Không thể cập nhật theo dõi', type: 'error' }));
    } else {
      dispatch(showToast({ message: isFollowing ? 'Đã bỏ theo dõi' : 'Đã theo dõi nghệ sĩ', type: 'success' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full mt-20">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 gap-3 text-neutral-500">
        <Music2 size={48} className="opacity-30" />
        <p className="text-lg">Không tìm thấy thông tin nghệ sĩ</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mt-8 px-4">
      {/* Hero card */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer group h-72 shadow-2xl"
        onClick={() => artistId && navigate(`/artist/${artistId}`)}
      >
        <img
          src={artist.photo_url || artist.image_url || '/pictures/whiteBackground.jpg'}
          alt={artist.name}
          className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-neutral-300 uppercase tracking-widest mb-1">Nghệ sĩ</p>
              <h2 className="text-4xl font-extrabold text-white leading-tight flex items-center gap-2">
                {artist.name}
                {artist.isVerified && <BadgeCheck size={24} className="text-blue-400 flex-shrink-0" />}
              </h2>
              {artist.monthly_listeners && (
                <p className="text-sm text-neutral-300 mt-1">
                  {Number(artist.monthly_listeners).toLocaleString('vi-VN')} người nghe hàng tháng
                </p>
              )}
            </div>
            <ExternalLink size={20} className="text-white/50 group-hover:text-white transition flex-shrink-0 mb-1" />
          </div>
        </div>
      </div>

      {/* Bio + Follow */}
      <div className="mt-5 bg-white/5 rounded-2xl p-6 space-y-4 backdrop-blur-sm border border-white/10">
        {artist.bio ? (
          <p className="text-neutral-300 text-sm leading-relaxed line-clamp-5">{artist.bio}</p>
        ) : (
          <p className="text-neutral-500 text-sm italic">Nghệ sĩ chưa có thông tin giới thiệu.</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleFollow}
            className={`px-6 py-2 rounded-full text-sm font-bold border transition hover:scale-105 ${
              isFollowing
                ? 'border-green-500 text-green-400 hover:border-green-400'
                : 'border-white text-white hover:bg-white hover:text-black'
            }`}
          >
            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
          {artistId && (
            <button
              onClick={() => navigate(`/artist/${artistId}`)}
              className="px-6 py-2 rounded-full text-sm font-semibold text-neutral-300 hover:text-white transition flex items-center gap-1.5"
            >
              Xem trang nghệ sĩ <ExternalLink size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LyricsContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentSong, currentTime, lyricsOffset } = useSelector((state) => state.player);
  const { likedSongs } = useSelector((state) => state.auth);
  
  const [lyrics, setLyrics] = useState([]);
  const [displayMode, setDisplayMode] = useState('lyrics');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const dropdownRef = useRef(null);

  const isLiked = likedSongs.some((s) => s.song_id === currentSong?.song_id);

  useEffect(() => {
    if (!currentSong) {
      navigate('/', { replace: true });
    }
  }, [currentSong, navigate]);

  useEffect(() => {
    if (currentSong?.song_id) {
      getLyrics(currentSong.song_id).then((data) => {
        setLyrics(normalizeLyrics(data));
      });
      setDisplayMode('lyrics');
    }
  }, [currentSong]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Đóng dropdown khi click ra ngoài (TASK-007)
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setShowDropdown(false);
        setShowPlaylistSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const handleOpenPlaylistSubmenu = async () => {
    const data = await getMyPlaylists();
    setPlaylists(data);
    setShowPlaylistSubmenu(true);
  };

  const handleAddToPlaylist = async (playlist) => {
    await addSongToPlaylist(playlist.id, currentSong);
    dispatch(showToast({ message: `Đã thêm vào "${playlist.name}"`, type: 'success' }));
    setShowDropdown(false);
    setShowPlaylistSubmenu(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?song=${currentSong.song_id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        dispatch(showToast({ message: 'Đã sao chép link chia sẻ', type: 'success' }));
      }).catch(() => window.prompt('Copy link:', url));
    } else {
      window.prompt('Copy link:', url);
    }
    setShowDropdown(false);
  };

  if (!currentSong) return null;

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col bg-gradient-to-br from-[#1e1e1e] to-[#000000] p-8 overflow-y-auto overflow-x-hidden z-40 transition-all">
      
      {/* HEADER ĐIỀU KHIỂN */}
      <div className="flex items-center justify-between mb-8 z-10 sticky top-0 bg-[#1e1e1e]/50 backdrop-blur-md py-4 rounded-lg px-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-white tracking-wide">{currentSong.title}</h2>
          <span className="text-[#b3b3b3] font-medium">{currentSong.artist_name}</span>
        </div>

        <div className="flex items-center gap-4 text-[#b3b3b3]">
          <button className={`hover:text-white transition ${displayMode === 'artwork' ? 'text-green-500' : ''}`} onClick={() => setDisplayMode('artwork')} title="Xem ảnh bìa"><Disc size={22} /></button>
          <button className={`hover:text-white transition ${displayMode === 'canvas' ? 'text-green-500' : ''}`} onClick={() => setDisplayMode('canvas')} title="Canvas video"><PlayCircle size={22} /></button>
          <button className={`hover:text-white transition ${displayMode === 'artist' ? 'text-green-500' : ''}`} onClick={() => setDisplayMode('artist')} title="Thông tin nghệ sĩ"><UserSquare2 size={22} /></button>
          <button className={`transition ${displayMode === 'lyrics' ? 'text-green-500' : 'hover:text-white'}`} onClick={() => setDisplayMode('lyrics')} title="Xem lời bài hát"><Mic2 size={22} /></button>
          
          {/* Lyrics offset controls */}
          {displayMode === 'lyrics' && lyrics.some((l) => l.time > 0) && (
            <div className="flex items-center gap-1 text-xs">
              <button onClick={() => dispatch(adjustLyricsOffset(-0.5))} className="p-1 rounded hover:bg-white/10 hover:text-white transition" title="Lời chậm hơn 0.5s"><Minus size={13} /></button>
              <button onClick={() => dispatch(resetLyricsOffset())} className="px-1.5 py-0.5 rounded hover:bg-white/10 hover:text-white transition min-w-[50px] text-center" title="Reset offset">
                {lyricsOffset === 0 ? 'Sync' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}
              </button>
              <button onClick={() => dispatch(adjustLyricsOffset(0.5))} className="p-1 rounded hover:bg-white/10 hover:text-white transition" title="Lời nhanh hơn 0.5s"><Plus size={13} /></button>
              {lyricsOffset !== 0 && (
                <button onClick={() => dispatch(resetLyricsOffset())} className="p-1 rounded hover:bg-white/10 hover:text-white transition" title="Reset"><RotateCcw size={12} /></button>
              )}
            </div>
          )}

          <span className="text-[#333]">|</span>

          {/* Dropdown (TASK-007: ref bọc ngoài toàn bộ) */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="hover:text-white transition"
              title="Tùy chọn thêm"
            >
              <MoreHorizontal size={24} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-8 w-56 bg-[#282828] rounded-md shadow-2xl z-50 p-1 border border-[#3e3e3e]">
                {/* Save to Liked Songs (TASK-006-A) */}
                <button
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                  onClick={() => { dispatch(toggleLikeSongThunk(currentSong)); setShowDropdown(false); }}
                >
                  {isLiked ? <HeartOff size={18} /> : <Heart size={18} />}
                  {isLiked ? 'Đã thêm vào Bài hát yêu thích' : 'Lưu vào Bài hát yêu thích'}
                </button>

                {/* Add to Playlist (TASK-006-B) */}
                <div className="relative">
                  <button
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                    onClick={handleOpenPlaylistSubmenu}
                  >
                    <PlusCircle size={18} /> Thêm vào playlist
                  </button>
                  {showPlaylistSubmenu && (
                    <div className="absolute left-full top-0 w-48 bg-[#282828] rounded-md shadow-2xl z-50 p-1 border border-[#3e3e3e]">
                      {playlists.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-neutral-500">Chưa có playlist</p>
                      ) : playlists.map((pl) => (
                        <button
                          key={pl.id}
                          className="w-full text-left px-3 py-2 text-sm text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition truncate"
                          onClick={() => handleAddToPlaylist(pl)}
                        >
                          {pl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add to Queue */}
                <button 
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                  onClick={() => { dispatch(addToQueue(currentSong)); setShowDropdown(false); }}
                >
                  <ListPlus size={18} /> Add to queue
                </button>

                {/* Hide song (TASK-006-C) */}
                <button
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                  onClick={() => { dispatch(showToast({ message: 'Đã ẩn bài hát này', type: 'info' })); setShowDropdown(false); }}
                >
                  <EyeOff size={18} /> Ẩn bài hát này
                </button>

                <div className="h-[1px] bg-[#3e3e3e] my-1" />

                {/* Share (TASK-006-D) */}
                <button
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                  onClick={handleShare}
                >
                  <Share2 size={18} /> Chia sẻ
                </button>

                {/* Report */}
                <button
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                  onClick={() => { dispatch(openReportModal(currentSong)); setShowDropdown(false); }}
                >
                  <Flag size={18} /> Báo cáo bài hát
                </button>
              </div>
            )}
          </div>

          {/* Minimize → về previousView và bật PiP (TASK-002-C) */}
          <button
            onClick={() => minimizeToPiP(dispatch, navigate)}
            title="Thu nhỏ lời bài hát"
            className="hover:text-white ml-2 transition"
          >
            <PictureInPicture2 size={20} />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            className="hover:text-white ml-2 transition"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* KHU VỰC HIỂN THỊ CHÍNH */}
      <div className="flex flex-col items-center w-full min-h-screen">
        
        {displayMode === 'lyrics' && <LyricsMode lyrics={lyrics} currentTime={currentTime} duration={currentSong.duration} offset={lyricsOffset} />}
        
        {/* Artwork: luôn hiện spinning album art */}
        {displayMode === 'artwork' && (
          <div className="relative mt-10">
            <div className="w-[400px] h-[400px] rounded-full animate-[spin_20s_linear_infinite] shadow-2xl ring-4 ring-neutral-700 overflow-hidden">
              <img
                src={currentSong.image_url || '/pictures/songDefault.jpg'}
                alt="artwork"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/songDefault.jpg'; }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-[#1e1e1e] ring-2 ring-neutral-600" />
            </div>
          </div>
        )}

        {/* Canvas: hiện MV video nếu có, fallback về thông báo */}
        {displayMode === 'canvas' && (
          currentSong.mv_url ? (
            <VideoPlayer src={currentSong.mv_url} />
          ) : (
            <div className="flex flex-col items-center justify-center mt-24 gap-4 text-neutral-400">
              <PlayCircle size={56} className="opacity-30" />
              <p className="text-lg font-semibold">Bài hát này chưa có video MV</p>
            </div>
          )
        )}

        {displayMode === 'artist' && <ArtistInfoPanel song={currentSong} />}

        <BottomInfo currentSong={currentSong} />
      </div>
    </div>
  );
}
