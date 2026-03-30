import React, { useRef, useEffect } from 'react';
import { streamSong } from '../../services/UserService';

export default function Audio({ currentSong, isPlaying, volume, seekTime, onTimeUpdate, onEnded }) {
  const audioRef = useRef(null);

  // 30s active listening tracker
  const listeningTimeRef = useRef(0);
  const lastTimeRef = useRef(null);
  const streamCalledRef = useRef(false);

  // Reset tracker khi đổi bài
  useEffect(() => {
    listeningTimeRef.current = 0;
    lastTimeRef.current = null;
    streamCalledRef.current = false;
  }, [currentSong?.song_id]);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.log("Lỗi autoplay:", err));
    } else {
      audioRef.current.pause();
      // Reset lastTime khi pause để không tích lũy thời gian pause
      lastTimeRef.current = null;
    }
  }, [isPlaying, currentSong?.song_id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && seekTime !== null) {
      audioRef.current.currentTime = seekTime;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [seekTime, isPlaying]);

  const handleTimeUpdate = (currentTime) => {
    // Tích lũy thời gian nghe thực (không tính pause, không tính seek jumps)
    if (isPlaying && lastTimeRef.current !== null) {
      const delta = currentTime - lastTimeRef.current;
      if (delta > 0 && delta < 2) {
        listeningTimeRef.current += delta;
      }
    }
    lastTimeRef.current = currentTime;

    // Gọi stream endpoint đúng 1 lần khi đủ 30s
    if (!streamCalledRef.current && listeningTimeRef.current >= 30 && currentSong?.song_id) {
      streamCalledRef.current = true;
      streamSong(currentSong.song_id);
    }

    onTimeUpdate(currentTime);
  };

  return (
    <audio
      ref={audioRef}
      src={currentSong?.audio_url}
      onTimeUpdate={(e) => handleTimeUpdate(e.target.currentTime)}
      onEnded={onEnded}
      className="hidden"
    />
  );
}
