// AppWithHistory.jsx
"use client"
import { useState, useEffect, useCallback } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Player from "./PlayerWithHistory"
import HistoryPage from "../mainpage/HistoryPage"
import FavoritePage from "../mainpage/FavoritePage"
import { SongHistoryService } from "./SongHistoryService"

export default function MusicApp() {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  useEffect(() => {
    const savedQueue = localStorage.getItem("playingQueue")
    if (savedQueue) {
      const parsedQueue = JSON.parse(savedQueue)
      setQueue(parsedQueue)

      const currentSongIndex = localStorage.getItem("currentSongIndex")
      if (currentSongIndex && parsedQueue.length > 0) {
        const index = Number.parseInt(currentSongIndex, 10)
        if (!isNaN(index) && index >= 0 && index < parsedQueue.length) {
          setCurrentIndex(index)
          setCurrentSong(parsedQueue[index])
        }
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("playingQueue", JSON.stringify(queue))
    if (currentIndex >= 0) {
      localStorage.setItem("currentSongIndex", currentIndex.toString())
    }
  }, [queue, currentIndex])

  const playSong = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = {
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        artist: song.artist || { artist_name: song.artist_name || "Unknown Artist" },
        duration: song.duration || 0,
        image_url: song.image_url || song.cover || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
        isPlaying: true,
      }
      setCurrentSong(formattedSong)
      setIsPlaying(true)

      const songIndex = queue.findIndex((s) => s.song_id === song.song_id)
      if (songIndex >= 0) {
        setCurrentIndex(songIndex)
      } else {
        setQueue((prev) => [...prev, formattedSong])
        setCurrentIndex(queue.length)
      }
      SongHistoryService.addToHistory({
        ...formattedSong,
        lastPlayed: new Date().toISOString(),
        playCount: (SongHistoryService.getHistory().find((s) => s.song_id === song.song_id)?.playCount || 0) + 1,
      })
    },
    [queue],
  )

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const playNext = useCallback(() => {
    if (queue.length === 0) return

    const nextIndex = (currentIndex + 1) % queue.length
    setCurrentIndex(nextIndex)
    setCurrentSong(queue[nextIndex])
    setIsPlaying(true)
    SongHistoryService.addToHistory({
      ...queue[nextIndex],
      lastPlayed: new Date().toISOString(),
      playCount: (SongHistoryService.getHistory().find((s) => s.song_id === queue[nextIndex].song_id)?.playCount || 0) + 1,
    })
  }, [queue, currentIndex])

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return

    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    setCurrentSong(queue[prevIndex])
    setIsPlaying(true)
    SongHistoryService.addToHistory({
      ...queue[prevIndex],
      lastPlayed: new Date().toISOString(),
      playCount: (SongHistoryService.getHistory().find((s) => s.song_id === queue[prevIndex].song_id)?.playCount || 0) + 1,
    })
  }, [queue, currentIndex])

  const addToQueue = useCallback((song) => {
    if (!song?.song_id) return
    const formattedSong = {
      song_id: song.song_id,
      title: song.title || "Unknown Title",
      artist: song.artist || { artist_name: song.artist_name || "Unknown Artist" },
      duration: song.duration || 0,
      image_url: song.image_url || song.cover || "/placeholder.svg",
      audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
    }
    setQueue((prev) => [...prev, formattedSong])
  }, [])

  const addToPlayNext = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = {
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        artist: song.artist || { artist_name: song.artist_name || "Unknown Artist" },
        duration: song.duration || 0,
        image_url: song.image_url || song.cover || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
      }
      setQueue((prev) => {
        const newQueue = [...prev]
        newQueue.splice(currentIndex + 1, 0, formattedSong)
        return newQueue
      })
    },
    [currentIndex],
  )

  return (
    <Router>
      <div className="music-app">
        <main className="main-content">
          <Routes>
            <Route
              path="/history"
              element={
                <HistoryPage
                  playSong={playSong}
                  currentSong={currentSong}
                  addToQueue={addToQueue}
                  playNext={addToPlayNext}
                />
              }
            />
            <Route
              path="/favorite"
              element={
                <FavoritePage
                  playSong={playSong}
                  currentSong={currentSong}
                  addToQueue={addToQueue}
                  playNext={addToPlayNext}
                />
              }
            />
            <Route
              path="/"
              element={
                <HistoryPage
                  playSong={playSong}
                  currentSong={currentSong}
                  addToQueue={addToQueue}
                  playNext={addToPlayNext}
                />
              }
            />
          </Routes>
        </main>

        {currentSong && (
          <div className="player-container">
            <Player
              currentSong={currentSong}
              onPlayPause={togglePlayPause}
              onNext={playNext}
              onPrevious={playPrevious}
              isPlaying={isPlaying}
            />
          </div>
        )}
      </div>
    </Router>
  )
}