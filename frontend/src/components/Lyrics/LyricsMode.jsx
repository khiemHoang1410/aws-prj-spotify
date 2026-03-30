import React from 'react';
import { useDispatch } from 'react-redux';
import { seekToTime } from '../../store/playerSlice';

export default function LyricsMode({ lyrics, currentTime, duration }) {
  const dispatch = useDispatch();

  if (!lyrics || lyrics.length === 0) {
    return <p className="text-3xl font-bold text-white/50 py-20">Không có lời cho bài hát này.</p>;
  }

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 text-center py-10">
      {lyrics.map((lyric, index) => {
        const nextTime = lyrics[index + 1] ? lyrics[index + 1].time : duration;
        const isActive = currentTime >= lyric.time && currentTime < nextTime;
        return (
          <p key={index} onClick={() => dispatch(seekToTime(lyric.time))}
             className={`text-3xl md:text-4xl lg:text-5xl font-bold transition-all duration-300 cursor-pointer 
               ${isActive ? 'text-white scale-105' : 'text-white/30 hover:text-white/60'}
             `}>
             {lyric.text}
          </p>
        );
      })}
    </div>
  );
}
