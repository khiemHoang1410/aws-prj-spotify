"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from "lucide-react"
import { useTrackSongPlay } from "./SongHistoryService"

export default function Player({ currentSong, onPlayPause, onNext, onPrevious, isPlaying }) {
  const [volume, setVolume] = useState(0.7)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const { trackPlay } = useTrackSongPlay()

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.audio_url
      audioRef.current.load()
      if (isPlaying) {
        audioRef.current.play()

        // Track play with daily tracking
        const today = new Date().toISOString().split("T")[0]

        // Get existing history
        const existingHistory = JSON.parse(localStorage.getItem("songHistory") || "[]")
        const existingSong = existingHistory.find((s) => s.song_id === currentSong.song_id)

        const dailyPlays = existingSong?.dailyPlays || {}
        dailyPlays[today] = (dailyPlays[today] || 0) + 1

        trackPlay({
          ...currentSong,
          dailyPlays: dailyPlays,
          playDate: today,
        })

        // Update backend if user is logged in
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            fetch(`/api/users/${userData.user_id}/listening_history/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user: userData.user_id,
                song: currentSong.song_id,
                date: today,
                play_count: dailyPlays[today],
              }),
            }).catch((error) => console.error("Error updating listening history:", error))
          } catch (err) {
            console.error("Error parsing user data:", err)
          }
        }
      }
    }
  }, [currentSong, isPlaying, trackPlay])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const formatTime = useCallback((time) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime)
      setDuration(audioRef.current.duration)
    }
  }, [])

  const handleSeek = useCallback((e) => {
    const newTime = Number.parseFloat(e.target.value)
    setProgress(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }, [])

  const handleVolumeChange = useCallback((e) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
  }, [])

  const getVolumeIcon = useCallback(() => {
    if (volume === 0) return <VolumeX size={20} />
    if (volume < 0.5) return <Volume1 size={20} />
    return <Volume2 size={20} />
  }, [volume])

  return (
    <div className="player">
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={onNext} onLoadedMetadata={handleTimeUpdate} />

      <div className="player-left">
        {currentSong && (
          <div className="current-song">
            <img src={currentSong.cover || currentSong.image_url || "/placeholder.svg"} alt={currentSong.title} />
            <div className="current-song-info">
              <div className="current-song-title">{currentSong.title}</div>
              <div className="current-song-artist">
                {typeof currentSong.artist === "string" ? currentSong.artist : currentSong.artist?.artist_name}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button className="control-button" onClick={onPrevious}>
            <SkipBack size={20} />
          </button>

          <button className="play-pause-button" onClick={onPlayPause}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button className="control-button" onClick={onNext}>
            <SkipForward size={20} />
          </button>
        </div>

        <div className="progress-container">
          <span className="time">{formatTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            className="progress-slider"
          />
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <div className="volume-control">
          {getVolumeIcon()}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  )
}
