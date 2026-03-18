import React, { useRef, useEffect } from 'react';

export default function Audio({ currentSong, isPlaying, volume, seekTime, onTimeUpdate, onEnded }) {
  const audioRef = useRef(null);

  // 1. Lắng nghe Play/Pause
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => console.log("Đang chờ tương tác để phát nhạc:", err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // 2. Lắng nghe thay đổi âm lượng
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 3. Lắng nghe lệnh tua nhạc (Seek)
  useEffect(() => {
    if (audioRef.current && seekTime !== null) {
      audioRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

  return (
    <audio
      ref={audioRef}
      src={currentSong?.audio_url}
      // Chỉ gửi thời gian lên PlayerBar khi user KHÔNG phải đang dùng tay kéo thanh progress
      onTimeUpdate={(e) => onTimeUpdate(e.target.currentTime)}
      onEnded={onEnded}
      className="hidden"
    />
  );
}