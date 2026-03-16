"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, SkipBack, Play, Pause, SkipForward, Repeat, Shuffle, Volume2 } from "lucide-react";

const PlayingSong = ({
  currentSong,
  onClose,
  togglePlay,
  currentTime,
  duration,
  handleSeek,
  audioRef,
  volume,
  setVolume,
  handleNext,
  handlePrevious,
  shuffle,
  toggleShuffle,
  repeat,
  toggleRepeat,
}) => {
  const [lyricsLines, setLyricsLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const progressRef = useRef(null);
  const lyricsContainerRef = useRef(null);

  const DEFAULT_VINYL_BACKGROUND = "http://localhost:8000/static/images/vinyl_record.png";
  const DEFAULT_BACKGROUND = "http://localhost:8000/static/images/background.png";

  // Kiểm tra bài hát hợp lệ
  const isValidSong = useCallback(
    (song) => {
      return (
        song &&
        song.song_id &&
        song.audio_url &&
        typeof song.title === "string" &&
        (song.artist?.artist_name || typeof song.artist === "string")
      );
    },
    []
  );

  const parseLyrics = useCallback((lyrics) => {
    const defaultLyrics = [{ time: 0, text: "No lyrics available" }];

    if (!lyrics) {
      console.warn("Lyrics không tồn tại:", lyrics);
      return defaultLyrics;
    }

    if (typeof lyrics === "object") {
      try {
        if (Array.isArray(lyrics)) {
          return lyrics.map((line) => {
            const timeMatch = line.time?.match(/(\d+):(\d+\.\d+)/);
            const time = timeMatch
              ? Number.parseInt(timeMatch[1]) * 60 + Number.parseFloat(timeMatch[2])
              : Number.POSITIVE_INFINITY;
            return {
              time,
              text: line.text?.trim() || "No text",
            };
          });
        }
        console.warn("Lyrics JSON không đúng định dạng mảng:", lyrics);
        return defaultLyrics;
      } catch (error) {
        console.error("Lỗi xử lý lyrics JSON:", error);
        return defaultLyrics;
      }
    }

    if (typeof lyrics === "string") {
      return lyrics.split("\n").map((line) => {
        const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
        if (match) {
          const time = Number.parseInt(match[1]) * 60 + Number.parseFloat(match[2]);
          return { time, text: match[3].trim() };
        }
        return { time: Number.POSITIVE_INFINITY, text: line.trim() };
      });
    }

    console.warn("Lyrics không hợp lệ:", lyrics);
    return defaultLyrics;
  }, []);

  const formatTime = useCallback((time) => {
    if (!time && time !== 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (isValidSong(currentSong)) {
      setLyricsLines(parseLyrics(currentSong.lyrics));
    } else {
      setLyricsLines([{ time: 0, text: "No lyrics available" }]);
    }
  }, [currentSong, parseLyrics, isValidSong]);

  useEffect(() => {
    const index = lyricsLines.findIndex(
      (line, i) => currentTime >= line.time && (!lyricsLines[i + 1] || currentTime < lyricsLines[i + 1].time)
    );
    if (index !== currentLineIndex) {
      setCurrentLineIndex(index);
      if (lyricsContainerRef.current && index >= 0) {
        lyricsContainerRef.current.children[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentTime, lyricsLines, currentLineIndex]);

  const handleProgressChange = useCallback(
    (e) => {
      const rect = progressRef.current?.getBoundingClientRect();
      if (!rect || !audioRef.current) return;
      const position = (e.clientX - rect.left) / rect.width;
      const newTime = position * duration;
      if (Number.isFinite(newTime) && newTime >= 0 && newTime <= duration) {
        handleSeek(newTime);
      }
    },
    [duration, handleSeek, audioRef]
  );

  if (!isValidSong(currentSong)) return null;

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const backgroundStyle = {
    backgroundImage: `url(${currentSong.vinyl_background || DEFAULT_BACKGROUND})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  return (
    <div className="playing-song-container" style={backgroundStyle}>
      <div className="box">
        <button className="exit-fullscreen-button" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="playing-song-layout">
          <div className="playing-song-album-container">
            <div className="playing-song-album">
              <div
                className={`vinyl-record ${currentSong.isPlaying ? "spinning" : ""}`}
                style={{
                  backgroundImage: `url(${currentSong.vinyl_background || DEFAULT_VINYL_BACKGROUND})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="vinyl-hole"></div>
                <div className="vinyl-reflection"></div>
              </div>
            </div>
            <div className="playing-song-info">
              <h2 className="playing-song-title">{currentSong.title}</h2>
              <p className="playing-song-artist">{currentSong.artist?.artist_name || currentSong.artist}</p>
            </div>
            <div className="playing-song-progress-container">
              <div className="playing-song-time">{formatTime(currentTime)}</div>
              <div className="playing-song-progress-bar" ref={progressRef} onClick={handleProgressChange}>
                <div className="playing-song-progress" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <div className="playing-song-time">{formatTime(duration)}</div>
            </div>
            <div className="playing-song-controls">
              <button className={`control-button ${shuffle ? "active" : ""}`} onClick={toggleShuffle}>
                <Shuffle size={18} />
              </button>
              <button className="control-button" onClick={handlePrevious}>
                <SkipBack size={18} />
              </button>
              <button className="play-pause-button" onClick={togglePlay}>
                {currentSong.isPlaying ? <Pause size={25} /> : <Play size={25} />}
              </button>
              <button className="control-button" onClick={handleNext}>
                <SkipForward size={18} />
              </button>
              <button className={`control-button ${repeat !== "off" ? "active" : ""}`} onClick={toggleRepeat}>
                <Repeat size={18} />
              </button>
            </div>
            <div className="playing-song-volume-container">
              <Volume2 size={20} />
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
                className="playing-song-volume-slider"
              />
            </div>
          </div>
          <div className="playing-song-lyrics-container" ref={lyricsContainerRef}>
            <div className="playing-song-lyrics">
              {lyricsLines.map((line, index) => (
                <p
                  key={`lyrics-${index}`}
                  className={`playing-song-lyrics-line ${index === currentLineIndex ? "active" : ""}`}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayingSong;