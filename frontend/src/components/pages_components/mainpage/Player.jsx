// Player.jsx
"use client";
import { useMemo } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  Maximize2,
  ListMusic,
} from "lucide-react";

function Player({
  currentSong,
  setShowFullScreen,
  toggleQueue,
  audioRef,
  currentTime,
  duration,
  volume,
  setVolume,
  handleNext,
  handlePrevious,
  togglePlay,
  shuffle,
  toggleShuffle,
  repeat,
  toggleRepeat,
  handleSeek,
}) {
  const formatTime = (time) => {
    if (!time && time !== 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const waveBars = useMemo(
    () => Array.from({ length: 50 }, (_, i) => ({ id: i, height: Math.random() * 20 + 5 })),
    []
  );

  if (!currentSong) return <div className="player">Chưa có bài hát nào được chọn.</div>;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player">
      <div className="player-left">
        <div className="current-song">
          <img src={currentSong.image_url || "/placeholder.svg"} alt={currentSong.title} />
          <div className="current-song-info">
            <p className="current-song-title">{currentSong.title}</p>
            <p className="current-song-artist">{currentSong.artist?.artist_name || currentSong.artist}</p>
          </div>
        </div>
      </div>
      <div className="player-center">
        <div className="player-controls">
          <button className={`control-button ${shuffle ? "active" : ""}`} onClick={toggleShuffle}>
            <Shuffle size={18} />
          </button>
          <button className="control-button" onClick={handlePrevious}>
            <SkipBack size={18} />
          </button>
          <button className="play-pause-button" onClick={togglePlay}>
            {currentSong.isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="control-button" onClick={handleNext}>
            <SkipForward size={18} />
          </button>
          <button className={`control-button ${repeat !== "off" ? "active" : ""}`} onClick={toggleRepeat}>
            <Repeat size={18} />
          </button>
        </div>
        <div className="progress-container">
          <span className="time">{formatTime(currentTime)}</span>
          <div className="progress-bar-container">
            <div className="waveform" style={{ pointerEvents: "none" }}>
              {waveBars.map((bar) => (
                <div
                  key={bar.id}
                  className="wave-bar"
                  style={{
                    height: `${bar.height}px`,
                    background:
                      bar.id < Math.floor((progressPercentage / 100) * waveBars.length)
                        ? "white"
                        : "rgba(255, 255, 255, 0.2)",
                  }}
                />
              ))}
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="progress-slider"
              style={{ zIndex: 10 }}
            />
          </div>
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="player-right">
        <div className="volume-control">
          <Volume2 size={18} />
          <input
            type="range"
            min="0"
            max="100"
            value={Number.isFinite(volume) ? volume : 80}
            onChange={(e) => {
              const newVolume = Number(e.target.value);
              if (Number.isFinite(newVolume)) {
                setVolume(newVolume);
              }
            }}
            className="volume-slider"
          />
        </div>
        <button className="fullscreen-button" onClick={() => setShowFullScreen(true)}>
          <Maximize2 size={18} />
        </button>
        <button className="playlist-playing-page-button" onClick={toggleQueue}>
          <ListMusic size={18} />
        </button>
      </div>
    </div>
  );
}

export default Player;