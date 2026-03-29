import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { togglePlay, updateCurrentTime, clearSeekTime, playNextSong, toggleShuffle, cycleRepeat } from '../../store/playerSlice';
import { toggleLikeSong } from '../../store/authSlice';
import { toggleRightSidebar, setPiP } from '../../store/uiSlice';
import Audio from './Audio';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, Mic2, ListMusic, MonitorSpeaker, Volume2, Volume1, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { REPEAT_MODE } from '../../constants/enums';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export default function PlayerBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { currentSong, isPlaying, globalSeekTime, queue, isShuffle, repeatMode } = useSelector((state) => state.player);
  const { isRightSidebarOpen, isPiP } = useSelector((state) => state.ui);
  const { likedSongs } = useSelector((state) => state.auth);
  
  const isLyricsPage = location.pathname === '/lyrics';
  
  const [currentTimeLocal, setCurrentTimeLocal] = useState(0);
  const [volume, setVolume] = useState(1); 
  const [seekTime, setSeekTime] = useState(null); 
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(1);
  const isSeeking = useRef(false); // block onTimeUpdate ngay sau seek

  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);

  useEffect(() => {
    if (globalSeekTime !== null) {
      setCurrentTimeLocal(globalSeekTime);
      isSeeking.current = true;
      setTimeout(() => { isSeeking.current = false; }, 300);
      setSeekTime(globalSeekTime);
      setTimeout(() => dispatch(clearSeekTime()), 100);
    }
  }, [globalSeekTime, dispatch]);

  const updateProgress = (e) => {
    if (!progressBarRef.current || !currentSong?.duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
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

  if (!currentSong) return <div className="h-full px-4 flex items-center justify-center text-[#b3b3b3] text-sm font-semibold">Chọn một bài hát để bắt đầu phát</div>;

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    return `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`;
  };

  const displayTime = isDraggingProgress ? dragTime : currentTimeLocal;
  const progressPercent = currentSong.duration ? (displayTime / currentSong.duration) * 100 : 0;
  const volumePercent = volume * 100;

  return (
    <div className="h-full px-4 flex items-center justify-between relative">
      
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
        onEnded={() => { 
           if (repeatMode === REPEAT_MODE.ONE) {
              setSeekTime(0);
              setTimeout(() => setSeekTime(null), 100);
           } else if (queue && queue.length > 0) {
              dispatch(playNextSong());
           } else if (repeatMode === REPEAT_MODE.ALL) {
              setSeekTime(0);
              setTimeout(() => setSeekTime(null), 100);
           } else {
              dispatch(togglePlay()); 
              setCurrentTimeLocal(0); 
           }
        }}
      />

      {/* 1. KHU VỰC BÊN TRÁI */}
        <div className="flex items-center gap-4 w-[30%] min-w-[180px]">
        <img
          src={currentSong.image_url}
          alt="cover"
          className="w-14 h-14 rounded shadow-sm object-cover"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
        />
        <div className="flex flex-col">
          <a href="#" className="text-white text-sm font-semibold hover:underline truncate">{currentSong.title}</a>
          <a href="#" className="text-[#b3b3b3] text-xs hover:underline truncate hover:text-white">{currentSong.artist_name}</a>
        </div>
        <button
          className={`ml-2 transition hover:scale-110 ${likedSongs.some(s => s.song_id === currentSong?.song_id) ? 'text-green-500' : 'text-[#b3b3b3] hover:text-white'}`}
          onClick={() => dispatch(toggleLikeSong(currentSong))}
          title="Yêu thích"
        >
          <Heart size={16} fill={likedSongs.some(s => s.song_id === currentSong?.song_id) ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* 2. KHU VỰC Ở GIỮA */}
      <div className="flex flex-col items-center max-w-[40%] w-full gap-2">
        <div className="flex items-center gap-6">
          <button
            className={`transition hover:scale-105 ${isShuffle ? 'text-green-400' : 'text-[#b3b3b3] hover:text-white'}`}
            onClick={() => dispatch(toggleShuffle())}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button className="text-[#b3b3b3] hover:text-white"><SkipBack size={20} fill="currentColor" /></button>
          
          <button className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition" onClick={() => dispatch(togglePlay())}>
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          
          <button className="text-[#b3b3b3] hover:text-white"><SkipForward size={20} fill="currentColor" /></button>
          <button
            className={`transition hover:scale-105 ${repeatMode !== REPEAT_MODE.OFF ? 'text-green-400' : 'text-[#b3b3b3] hover:text-white'}`}
            onClick={() => dispatch(cycleRepeat())}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === REPEAT_MODE.ONE ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full text-xs text-[#b3b3b3]">
          <span className="w-8 text-right">{formatTime(displayTime)}</span>
          
          <div ref={progressBarRef} onMouseDown={(e) => { setIsDraggingProgress(true); updateProgress(e); }} className="flex-1 h-4 group cursor-pointer flex items-center relative">
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full">
              <div className="h-1 bg-white group-hover:bg-green-500 rounded-full relative pointer-events-none" style={{ width: `${progressPercent}%` }}>
                 <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
              </div>
            </div>
          </div>
          
          <span className="w-8">{formatTime(currentSong.duration)}</span>
        </div>
      </div>

      {/* 3. KHU VỰC BÊN PHẢI */}
      <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px] text-[#b3b3b3]">
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

        <button className="hover:text-white"><MonitorSpeaker size={16} /></button>
        
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
          onClick={() => { if (isLyricsPage) { navigate(-1); } else { navigate('/lyrics'); } }}
          title={isLyricsPage ? 'Thu nhỏ' : 'Phóng to'}
          className="hover:text-white transition"
        >
          {isLyricsPage ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

    </div>
  );
}
