import React from 'react';
import { useDispatch } from 'react-redux';
import { seekToTime } from '../../store/playerSlice';

export default function LyricsMode({ lyrics, currentTime, duration, offset = 0 }) {
  const dispatch = useDispatch();

  if (!lyrics || !Array.isArray(lyrics) || lyrics.length === 0) {
    return <p className="text-3xl font-bold text-white/50 py-20">Không có lời cho bài hát này.</p>;
  }

  const adjustedTime = currentTime + offset;

  // Nếu tất cả dòng có time = 0 → plain text (không có timestamp) → không sync
  const hasTimestamps = lyrics.some((l) => l.time > 0);

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 text-center py-10">
      {lyrics.map((lyric, index) => {
        const nextTime = lyrics[index + 1] ? lyrics[index + 1].time : duration;
        const isActive = hasTimestamps && adjustedTime >= lyric.time && adjustedTime < nextTime;
        return (
          <p
            key={index}
            onClick={() => hasTimestamps && dispatch(seekToTime(lyric.time))}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold transition-all duration-300
              ${hasTimestamps ? 'cursor-pointer' : ''}
              ${isActive ? 'text-white scale-105' : hasTimestamps ? 'text-white/30 hover:text-white/60' : 'text-white/70'}
            `}
          >
            {lyric.text}
          </p>
        );
      })}
    </div>
  );
}
