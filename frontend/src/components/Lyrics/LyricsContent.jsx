import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getLyrics, getPlaylists, addSongToPlaylist } from '../../services/SongService';
import { setPiP, openReportModal, showToast } from '../../store/uiSlice';
import { toggleLikeSong } from '../../store/authSlice';
import { addToQueue } from '../../store/playerSlice';
import { Disc, PlayCircle, UserSquare2, Mic2, MoreHorizontal, Maximize, Minimize2, PlusCircle, Heart, HeartOff, ListPlus, EyeOff, Share2, Flag } from 'lucide-react';

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

export default function LyricsContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentSong, currentTime } = useSelector((state) => state.player);
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
    if (currentSong?.song_id) {
      getLyrics(currentSong.song_id).then(data => setLyrics(data));
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
    const data = await getPlaylists();
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
                  onClick={() => { dispatch(toggleLikeSong(currentSong)); setShowDropdown(false); }}
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
            onClick={() => { dispatch(setPiP(true)); navigate(-1); }}
            title="Thu nhỏ lời bài hát"
            className="hover:text-white ml-2 transition"
          >
            <Minimize2 size={20} />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            className="hover:text-white ml-2 transition"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* KHU VỰC HIỂN THỊ CHÍNH */}
      <div className="flex flex-col items-center w-full min-h-screen">
        
        {displayMode === 'lyrics' && <LyricsMode lyrics={lyrics} currentTime={currentTime} duration={currentSong.duration} />}
        
        {/* TASK-001-B1: onError fallback về songDefault.jpg */}
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
        {displayMode === 'canvas' && <div className="text-white mt-20">Giao diện Canvas Video...</div>}
        {displayMode === 'artist' && <div className="text-white mt-20">Giao diện Artist Image...</div>}

        <BottomInfo currentSong={currentSong} />
      </div>
    </div>
  );
}
