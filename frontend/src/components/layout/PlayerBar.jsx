import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setCurrentSong, togglePlay, updateCurrentTime, clearSeekTime, playNextSong, playPreviousSong, toggleShuffle, cycleRepeat } from '../../store/playerSlice';
import { toggleLikeSongThunk } from '../../store/authSlice';
import { toggleRightSidebar, setPiP } from '../../store/uiSlice';
import { getSongs, recordView } from '../../services/SongService';
import { getTrendingSongs } from '../../services/RecommendationService';
import { toSongUrl } from '../../utils/songUrl';
import Audio from './Audio';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Mic2, ListMusic, MonitorSpeaker, Volume2, Volume1, VolumeX, Maximize2, Shrink } from 'lucide-react';
import { REPEAT_MODE } from '../../constants/enums';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';
const PLAYER_VOLUME_STORAGE_KEY = 'spotify_player_volume_v1';

const readInitialVolume = () => {
  if (typeof window === 'undefined') return 1;
  try {
    const rawVolume = localStorage.getItem(PLAYER_VOLUME_STORAGE_KEY);
    const parsedVolume = Number(rawVolume);
    if (!Number.isFinite(parsedVolume)) return 1;
    return Math.max(0, Math.min(1, parsedVolume));
  } catch {
    return 1;
  }
};

export default function PlayerBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentSong, isPlaying, currentTime, globalSeekTime, queue, history, isShuffle, repeatMode } = useSelector((state) => state.player);
  const { isRightSidebarOpen, isPiP } = useSelector((state) => state.ui);
  const { likedSongs, isAuthenticated } = useSelector((state) => state.auth);
  const historyEntries = useSelector((state) => state.history?.entries || []);

  const initialVolumeRef = useRef(readInitialVolume());

  const isLyricsPage = location.pathname === '/lyrics';

  const [currentTimeLocal, setCurrentTimeLocal] = useState(currentTime || 0);
  const [volume, setVolume] = useState(() => initialVolumeRef.current);
  const [seekTime, setSeekTime] = useState(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(() => initialVolumeRef.current === 0);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(() =>
    initialVolumeRef.current === 0 ? 1 : initialVolumeRef.current
  );
  const isSeeking = useRef(false); // block onTimeUpdate ngay sau seek

  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const countedSongIdsRef = useRef(new Set());

  useEffect(() => {
    const songId = currentSong?.song_id;
    if (!isAuthenticated || !songId) return;
    if (!isPlaying) return;
    if (currentTimeLocal < 20) return;
    if (countedSongIdsRef.current.has(songId)) return;

    countedSongIdsRef.current.add(songId);
    void recordView(songId);
  }, [isAuthenticated, currentSong?.song_id, currentTimeLocal, isPlaying]);

  useEffect(() => {
    if (globalSeekTime !== null) {
      setCurrentTimeLocal(globalSeekTime);
      isSeeking.current = true;
      setTimeout(() => { isSeeking.current = false; }, 300);
      setSeekTime(globalSeekTime);
      setTimeout(() => dispatch(clearSeekTime()), 100);
    }
  }, [globalSeekTime, dispatch]);

  useEffect(() => {
    if (!currentSong) return;
    const restoredTime = Number.isFinite(currentTime) ? currentTime : 0;
    setCurrentTimeLocal(restoredTime);
    if (restoredTime <= 0) return;

    isSeeking.current = true;
    setTimeout(() => { isSeeking.current = false; }, 300);
    setSeekTime(restoredTime);
    setTimeout(() => setSeekTime(null), 100);
  }, [currentSong?.song_id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PLAYER_VOLUME_STORAGE_KEY, String(volume));
    } catch {
      // Ignore localStorage errors
    }
  }, [volume]);

  const updateProgress = (e) => {
    if (!currentSong?.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    setDragTime(percent * currentSong.duration);
  };

  useEffect(() => {
    if (isDraggingProgress) {
      const handleMouseMove = (e) => updateProgress(e);
      const handleMouseUp = () => {
        setIsDraggingProgress(false);
        // Update UI ngay lập tức về đúng vị trí B
        setCurrentTimeLocal(dragTime);
        // Block onTimeUpdate trong 300ms để tránh nhảy về vị trí cũ
        isSeeking.current = true;
        setTimeout(() => { isSeeking.current = false; }, 300);
        setSeekTime(dragTime);
        setTimeout(() => setSeekTime(null), 100);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingProgress, dragTime]);

  const updateVolume = (e) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    setVolume(percent);
    if (percent === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  useEffect(() => {
    if (isDraggingVolume) {
      const handleMouseMove = (e) => updateVolume(e);
      const handleMouseUp = () => setIsDraggingVolume(false);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingVolume]);

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(volumeBeforeMute);
      setIsMuted(false);
    } else {
      setVolumeBeforeMute(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSkipBack = () => {
    if (currentTimeLocal > 3 || history.length === 0) {
      // Restart bài hiện tại
      setCurrentTimeLocal(0);
      isSeeking.current = true;
      setTimeout(() => { isSeeking.current = false; }, 300);
      setSeekTime(null);
      setTimeout(() => {
        setSeekTime(0);
        setTimeout(() => setSeekTime(null), 100);
      }, 0);
    } else {
      dispatch(playPreviousSong());
    }
  };

  const restartCurrentSong = () => {
    setCurrentTimeLocal(0);
    dispatch(updateCurrentTime(0));
    isSeeking.current = true;
    setTimeout(() => { isSeeking.current = false; }, 300);
    // Reset qua null trước để đảm bảo effect trong Audio luôn trigger
    setSeekTime(null);
    setTimeout(() => {
      setSeekTime(0);
      setTimeout(() => setSeekTime(null), 100);
    }, 0);
  };

  const getTrendingFallbackSong = async () => {
    const allSongs = await getSongs();
    const historyIds = new Set(historyEntries.map((entry) => entry.songId || entry.song_id));
    if (currentSong?.song_id) historyIds.add(currentSong.song_id);

    const trendingSongs = getTrendingSongs(allSongs);
    return trendingSongs.find((song) => !historyIds.has(song.song_id)) || null;
  };

  const handleSongEnded = async () => {
    if (repeatMode === REPEAT_MODE.ONE || repeatMode === REPEAT_MODE.ALL) {
      restartCurrentSong();
      return;
    }

    if (queue && queue.length > 0) {
      dispatch(playNextSong());
      return;
    }

    const fallbackSong = await getTrendingFallbackSong();
    if (fallbackSong) {
      dispatch(setCurrentSong(fallbackSong));
      return;
    }

    dispatch(togglePlay());
    setCurrentTimeLocal(0);
    dispatch(updateCurrentTime(0));
  };

  const handleNavigateLyrics = async () => {
    if (isLyricsPage && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        // Chờ fullscreen exit hoàn toàn
        await new Promise((resolve) => {
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
          // Fallback timeout nếu event không fire
          setTimeout(finish, 400);
        });
      } catch {
        // Ignore lỗi exit fullscreen
      }
    }
    // Navigate sau khi exit fullscreen
    if (isLyricsPage) {
      navigate(-1);
    } else {
      navigate('/lyrics');
    }
  };

  if (!currentSong) 
    return <>
      <div className="flex flex-col items-center w-full gap-2 bg-transparent">
        <div className="flex items-center justify-center sm:w-[40%] w-[80%] gap-6">
          <button
            className={`transition hover:scale-105 ${isShuffle ? 'text-green-400' : 'text-[#b3b3b3] hover:text-white'}`}
            disabled={true}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button className="text-white" disabled={true} title="Trước"><SkipBack size={20} fill="currentColor" /></button>

          <button className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full " disabled={true}>
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>

          <button className="text-white" disabled={true} title="Tiếp theo"><SkipForward size={20} fill="currentColor" /></button>
          <button
            className={`text-white'}`}
            disabled={true}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === REPEAT_MODE.ONE ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-2 sm:w-[40%] w-[80%] text-xs text-[#b3b3b3]">
          <span className="w-8 text-right cursor-pointer">-:--</span>

          <div className="flex-1 h-4 group cursor-pointer flex items-center relative">
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full" title='0:00'>
            </div>
          </div>

          <span className="w-8 cursor-pointer">-:--</span>
        </div>
      </div></>

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  };
  const displayTime = isDraggingProgress ? dragTime : currentTimeLocal;
  const progressPercent = currentSong.duration ? (displayTime / currentSong.duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <div className="h-full md:px-4 flex flex-col items-center justify-between relative">
      <Audio
        currentSong={currentSong}
        isPlaying={isPlaying}
        volume={volume}
        seekTime={seekTime}
        onTimeUpdate={(time) => {
          if (!isDraggingProgress && !isSeeking.current) {
            setCurrentTimeLocal(time);
            dispatch(updateCurrentTime(time));
          }
        }}
        onEnded={() => { void handleSongEnded(); }}
      />
      <div className="flex gap-1 w-full h-full item-center justify-between md:px-0 px-2" >
        {/* 1. KHU VỰC BÊN TRÁI */}
        <div className="flex items-center md:gap-4 gap-2 w-[30%] min-w-[180px] flex-1">
          <img
            src={currentSong.image_url}
            alt="cover"
            className="md:w-14 md:h-14 w-10 h-10 rounded shadow-sm object-cover"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
          />
          <div className="flex flex-col">
            <a
              onClick={() => currentSong.song_id && navigate(toSongUrl(currentSong))}
              className="text-white md:text-sm text-[10px] font-semibold hover:underline truncate cursor-pointer"
            >{currentSong.title}</a>
            <a
              onClick={() => currentSong.artist_id && navigate(`/artist/${currentSong.artist_id}`)}
              className="text-[#b3b3b3] md:text-xs text-[8px] font-bold hover:underline truncate hover:text-white cursor-pointer"
            >{currentSong.artist_name}</a>
          </div>
          <button
            className={`ml-2 hidden sm:block transition hover:scale-110 ${likedSongs.some(s => s.song_id === currentSong?.song_id) ? 'text-green-500' : 'text-[#b3b3b3] hover:text-white'}`}
            onClick={() => dispatch(toggleLikeSongThunk(currentSong))}
            title="Yêu thích"
          >
            <Heart size={16} fill={likedSongs.some(s => s.song_id === currentSong?.song_id) ? 'currentColor' : 'none'} />
          </button>
        </div>
        {/* 2. KHU VỰC Ở GIỮA */}
        <div className="hidden sm:flex flex-col items-center max-w-[40%] w-full gap-2 flex-1 justify-center">
          <div className="flex items-center gap-6">
            <button
              className={`transition hover:scale-105 ${isShuffle ? 'text-green-400' : 'text-[#b3b3b3] hover:text-white'}`}
              onClick={() => dispatch(toggleShuffle())}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>
            <button className="text-[#b3b3b3] hover:text-white" onClick={handleSkipBack} title="Trước"><SkipBack size={20} fill="currentColor" /></button>

            <button className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition" onClick={() => dispatch(togglePlay())}>
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>

            <button className="text-[#b3b3b3] hover:text-white" onClick={() => dispatch(playNextSong())} title="Tiếp theo"><SkipForward size={20} fill="currentColor" /></button>
            <button
              className={`transition hover:scale-105 ${repeatMode !== REPEAT_MODE.OFF ? 'text-green-400' : 'text-[#b3b3b3] hover:text-white'}`}
              onClick={() => dispatch(cycleRepeat())}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === REPEAT_MODE.ONE ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full text-xs text-[#b3b3b3]">
            <span className="w-8 text-right">{formatTime(displayTime)}</span>

              <div ref={progressBarRef} onMouseDown={(e) => { setIsDraggingProgress(true);updateProgress(e);}} className="flex-1 h-4 group cursor-pointer flex flex-col items-center justify-center relative">
                <div className="w-full h-1 bg-[#4d4d4d] rounded-full">
                  <div className="h-1 bg-white group-hover:bg-green-500 rounded-full relative pointer-events-none" style={{ width: `${progressPercent}%` }}>
                    <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow"></div>
                  </div>
                </div>
              </div>

            <span className="w-8">{formatTime(currentSong.duration)}</span>
          </div>
        </div>
        {/* Responsive mobile */}
        <div className="flex sm:hidden flex-col items-end justify-center max-w-[40%] w-full gap-2 flex-1">
          <div className="flex items-center justify-center gap-6">
            <button
              className={`ml-2 transition hover:scale-110 ${likedSongs.some(s => s.song_id === currentSong?.song_id) ? 'text-green-500' : 'text-[#b3b3b3] hover:text-white'}`}
              onClick={() => dispatch(toggleLikeSongThunk(currentSong))}
              title="Yêu thích"
            >
              <Heart size={18} fill={likedSongs.some(s => s.song_id === currentSong?.song_id) ? 'currentColor' : 'none'} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition" onClick={() => dispatch(togglePlay())}>
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>
        </div>
        {/* 3. KHU VỰC BÊN PHẢI */}
        <div className="hidden sm:flex items-center justify-end gap-3 w-[30%] min-w-[180px] text-[#b3b3b3] flex-1">
          <button
            className={`hover:scale-105 transition ${isLyricsPage || isPiP ? 'text-green-500' : 'hover:text-white'}`}
            onClick={() => {
              if (isPiP) {
                dispatch(setPiP(false));
                navigate('/lyrics');
              } else if (isLyricsPage) {
                navigate(-1);
              } else {
                navigate('/lyrics');
              }
            }}
            title="Lời bài hát"
          >
            <Mic2 size={16} />
          </button>

          <button
            className={`hover:scale-105 transition ${isRightSidebarOpen ? 'text-green-500' : 'hover:text-white'}`}
            onClick={() => dispatch(toggleRightSidebar())}
            title="Hàng chờ"
          >
            <ListMusic size={16} />
          </button>

          <button className="hover:text-white opacity-40 cursor-not-allowed" title="Kết nối thiết bị (sắp ra mắt)"><MonitorSpeaker size={16} /></button>

          <div className="flex items-center gap-2 w-24 group cursor-pointer">
            <button
              className="hover:text-white"
              onClick={handleMuteToggle}
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
            </button>
            <div ref={volumeBarRef} onMouseDown={(e) => { setIsDraggingVolume(true); updateVolume(e); }} className="flex-1 h-4 group cursor-pointer flex items-center relative">
              <div className="w-full h-1 bg-[#4d4d4d] rounded-full">
                <div className="h-1 bg-white group-hover:bg-green-500 rounded-full relative pointer-events-none" style={{ width: `${volumePercent}%` }}>
                  <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                </div>
              </div>
            </div>
          </div>

          {/* NÚt NAVIGATE TO LYRICS / THU NHỎ */}
          <button
            onClick={handleNavigateLyrics}
            title={isLyricsPage ? 'Thu nhỏ' : 'Phóng to'}
            className="hover:text-white transition"
          >
            {isLyricsPage ? <Shrink size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      {/* Progress Bar Mobile */}
      <div className="flex sm:hidden items-center gap-2 w-full text-xs text-[#b3b3b3]">
        <div ref={progressBarRef} onMouseDown={(e) => { setIsDraggingProgress(true);updateProgress(e);}} className="flex-1 h-4 group cursor-pointer flex flex-col items-center justify-end relative">
          <div className="w-full h-1 bg-[#4d4d4d] rounded-full">
            <div className="h-1 bg-white group-hover:bg-green-500 rounded-full relative pointer-events-none" style={{ width: `${progressPercent}%` }}>
              <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-white rounded-full shadow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
