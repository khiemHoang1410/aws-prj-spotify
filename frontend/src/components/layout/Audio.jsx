import React, { useRef, useEffect } from 'react';

export default function Audio({ currentSong, isPlaying, volume, seekTime, onTimeUpdate, onEnded }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => console.log("Lỗi autoplay:", err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong?.song_id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && seekTime !== null) {
      audioRef.current.currentTime = seekTime;
    }
  }, [seekTime]);

  return (
    <audio
      ref={audioRef}
      src={currentSong?.audio_url}
      onTimeUpdate={(e) => onTimeUpdate(e.target.currentTime)}
      onEnded={onEnded}
      className="hidden"
    />
  );
}
