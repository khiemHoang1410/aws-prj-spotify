import React, { useRef, useEffect } from 'react';
import { streamSong } from '../../services/UserService';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';

export default function Audio({ currentSong, isPlaying, volume, seekTime, onTimeUpdate, onEnded }) {
  const audioRef = useRef(null);
  const dispatch = useDispatch();

  // 30s active listening tracker
  const listeningTimeRef = useRef(0);
  const lastTimeRef = useRef(null);
  const streamCalledRef = useRef(false);
  const errorCountRef = useRef(0); // track consecutive errors để tránh spam toast

  // Reset tracker khi đổi bài
  useEffect(() => {
    listeningTimeRef.current = 0;
    lastTimeRef.current = null;
    streamCalledRef.current = false;
    errorCountRef.current = 0;
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

  const handleAudioError = (e) => {
    // Chỉ hiện toast lần đầu tiên để tránh spam
    if (errorCountRef.current > 0) return;
    errorCountRef.current += 1;

    const mediaError = e.target?.error;
    // MEDIA_ERR_SRC_NOT_SUPPORTED (4) hoặc MEDIA_ERR_NETWORK (2) — URL hết hạn hoặc không tải được
    const isExpired = mediaError?.code === 2 || mediaError?.code === 4;

    dispatch(showToast({
      message: isExpired
        ? 'Không thể phát bài hát này. URL có thể đã hết hạn, vui lòng thử lại.'
        : 'Lỗi phát nhạc. Vui lòng thử bài khác.',
      type: 'error',
    }));
  };

  return (
    <audio
      ref={audioRef}
      src={currentSong?.audio_url}
      onTimeUpdate={(e) => handleTimeUpdate(e.target.currentTime)}
      onEnded={onEnded}
      onError={handleAudioError}
      className="hidden"
    />
  );
}
