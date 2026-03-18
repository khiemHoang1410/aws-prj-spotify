import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { togglePlay } from '../store/playerSlice';
import Audio from './Audio'; 
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Heart, Mic2, ListMusic, MonitorSpeaker, Volume2, Maximize2 
} from 'lucide-react';

export default function PlayerBar() {
  const dispatch = useDispatch();
  const { currentSong, isPlaying } = useSelector((state) => state.player);
  
  const [currentTime, setCurrentTime] = useState(0);

  // --- CÁC STATE PHỤC VỤ CHỨC NĂNG KÉO THẢ ---
  const [volume, setVolume] = useState(1); // 1 = 100% âm lượng
  const [seekTime, setSeekTime] = useState(null); 
  
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Ref để lấy kích thước thật của thanh bar trên màn hình
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);

  // ==========================================
  // LOGIC KÉO THANH TIẾN TRÌNH (NHẠC)
  // ==========================================
  const updateProgress = (e) => {
    if (!progressBarRef.current || !currentSong?.duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent)); // Không cho kéo lố 0% hoặc 100%
    setDragTime(percent * currentSong.duration);
  };

  useEffect(() => {
    if (isDraggingProgress) {
      const handleMouseMove = (e) => updateProgress(e);
      const handleMouseUp = () => {
        setIsDraggingProgress(false);
        setSeekTime(dragTime); // Gửi lệnh chốt thời gian qua thẻ Audio
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

  // ==========================================
  // LOGIC KÉO THANH ÂM LƯỢNG
  // ==========================================
  const updateVolume = (e) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    setVolume(percent);
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

  if (!currentSong) {
    return (
      <div className="h-full px-4 flex items-center justify-center text-[#b3b3b3] text-sm font-semibold">
        Chọn một bài hát để bắt đầu phát
      </div>
    );
  }

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Tính toán % để CSS hiển thị. Nếu đang kéo thì lấy thời gian kéo, nếu không thì lấy thời gian thật của bài hát
  const displayTime = isDraggingProgress ? dragTime : currentTime;
  const progressPercent = currentSong.duration ? (displayTime / currentSong.duration) * 100 : 0;
  const volumePercent = volume * 100;

  const handleSongEnded = () => {
    dispatch(togglePlay());
    setCurrentTime(0); 
  };

  return (
    <div className="h-full px-4 flex items-center justify-between relative">
      
      <Audio 
        currentSong={currentSong}
        isPlaying={isPlaying}
        volume={volume}
        seekTime={seekTime}
        onTimeUpdate={(time) => {
          if (!isDraggingProgress) setCurrentTime(time);
        }} 
        onEnded={handleSongEnded}
      />

      {/* 1. KHU VỰC BÊN TRÁI: THÔNG TIN BÀI HÁT */}
      <div className="flex items-center gap-4 w-[30%] min-w-[180px]">
        <img src={currentSong.image_url} alt={currentSong.title} className="w-14 h-14 rounded shadow-sm object-cover" />
        <div className="flex flex-col justify-center">
          <a href="#" className="text-white text-sm font-semibold hover:underline truncate">{currentSong.title}</a>
          <a href="#" className="text-[#b3b3b3] text-xs hover:underline truncate hover:text-white">{currentSong.artist_name}</a>
        </div>
        <button className="text-[#b3b3b3] hover:text-white ml-2">
          <Heart size={16} />
        </button>
      </div>

      {/* 2. KHU VỰC Ở GIỮA: ĐIỀU KHIỂN & THANH TIẾN TRÌNH */}
      <div className="flex flex-col items-center max-w-[40%] w-full gap-2">
        <div className="flex items-center gap-6">
          <button className="text-[#b3b3b3] hover:text-white"><Shuffle size={16} /></button>
          <button className="text-[#b3b3b3] hover:text-white"><SkipBack size={20} fill="currentColor" /></button>
          
          <button 
            className="w-8 h-8 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition"
            onClick={() => dispatch(togglePlay())}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          
          <button className="text-[#b3b3b3] hover:text-white"><SkipForward size={20} fill="currentColor" /></button>
          <button className="text-[#b3b3b3] hover:text-white"><Repeat size={16} /></button>
        </div>

        <div className="flex items-center gap-2 w-full text-xs text-[#b3b3b3]">
          <span className="w-8 text-right">{formatTime(displayTime)}</span>
          
          {/* THANH TIẾN TRÌNH NHẠC */}
          <div 
            ref={progressBarRef}
            onMouseDown={(e) => {
              setIsDraggingProgress(true);
              updateProgress(e);
            }}
            // Lớp ngoài: Trong suốt, h-4 (16px) để tạo không gian bắt sự kiện chuột cho dễ
            className="flex-1 h-4 group cursor-pointer flex items-center relative"
          >
            {/* Lớp nền xám: Chỉ mảnh h-1 (4px) */}
            <div className="w-full h-1 bg-[#4d4d4d] rounded-full">
              {/* Lớp chạy tiến trình: Trắng/Xanh lá, cũng mảnh h-1 */}
              <div 
                className="h-1 bg-white group-hover:bg-green-500 rounded-full relative pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              >
                 <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
              </div>
            </div>
          </div>
          
          <span className="w-8">{formatTime(currentSong.duration)}</span>
        </div>
      </div>

      {/* 3. KHU VỰC BÊN PHẢI: ÂM LƯỢNG */}
      <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px] text-[#b3b3b3]">
        <button className="hover:text-white"><Mic2 size={16} /></button>
        <button className="hover:text-white"><ListMusic size={16} /></button>
        <button className="hover:text-white"><MonitorSpeaker size={16} /></button>
        
        <div className="flex items-center gap-2 w-24 group cursor-pointer">
          <button className="hover:text-white"><Volume2 size={16} /></button>
          
          {/* THANH ÂM LƯỢNG (ĐÃ GẮN SỰ KIỆN KÉO) */}
          <div 
            ref={volumeBarRef}
            onMouseDown={(e) => {
              setIsDraggingVolume(true);
              updateVolume(e);
            }}
            className="flex-1 h-4 group cursor-pointer flex items-center relative"       
          >
          {/* Lớp nền xám mỏng */}
             <div className="w-full h-1 bg-[#4d4d4d] rounded-full">
               <div 
                  className="h-1 bg-white group-hover:bg-green-500 rounded-full relative pointer-events-none"
                  style={{ width: `${volumePercent}%` }}
               >
                  <div className="hidden group-hover:block absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
               </div>
             </div>
          </div>
        </div>
        <button className="hover:text-white"><Maximize2 size={16} /></button>
      </div>

    </div>
  );
}