"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Routes, Route, useNavigate, useLocation } from "react-router-dom"
import "./style/PageMain.css"
import Sidebar from "../pages_components/mainpage/Sidebar"
import Header from "../pages_components/mainpage/Header"
import NewAlbums from "../pages_components/mainpage/NewAlbums"
import Artists from "../pages_components/mainpage/Artists"
import Videos from "../pages_components/mainpage/Videos"
import TopCharts from "../pages_components/mainpage/TopCharts"
import Playlists from "../pages_components/mainpage/Playlists"
import Player from "../pages_components/mainpage/Player"
import AlbumDetail from "../pages_components/mainpage/AlbumDetail"
import ArtistDetail from "../pages_components/mainpage/ArtistDetail"
import PlayingSong from "../pages_components/mainpage/PlayingSong"
import AllAlbums from "../pages_components/mainpage/AllAlbums"
import AllArtists from "../pages_components/mainpage/AllArtists"
import PlaylistDetail from "../pages_components/mainpage/PlaylistDetail"
import PlayingQueue from "../pages_components/mainpage/PlayingQueue"
import Song from "../pages_components/mainpage/Song"
import FavoritePage from "../pages_components/mainpage/FavoritePage"
import SearchResults from "../pages_components/mainpage/SearchResults"
import HistoryPage from "../pages_components/mainpage/HistoryPage"
import ChatBot from "../pages_components/chatbot/MusicChatBot"
import TimerModal from "../pages_components/ui/TimeModal"
import VideoDetail from "../pages_components/mainpage/VideoDetail"


function PageMain() {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false)
  const [showFullScreen, setShowFullScreen] = useState(false)
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [queue, setQueue] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState({ songs: [], albums: [], artists: [] })
  const [currentUser, setCurrentUser] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem("volume")
    return savedVolume ? Number(savedVolume) : 80
  })
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState("off")
  const [playedSongs, setPlayedSongs] = useState(new Set())
  const [timer, setTimer] = useState(null)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState(null)
  const audioRef = useRef(null)
  const queueInitializedRef = useRef(false)
  const playRequestRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Kiểm tra bài hát hợp lệ
  const isValidSong = useCallback((song) => {
    return (
      song &&
      song.song_id &&
      song.audio_url &&
      typeof song.title === "string" &&
      (song.artist?.artist_name || typeof song.artist === "string")
    )
  }, [])

  // Hàm định dạng bài hát
 const formatSong = useCallback((song) => {
  if (!song || (!song.id && !song.song_id)) {
    console.error("Invalid song data in formatSong:", song)
    return null
  }

  const formatted = {
    id: song.id || song.song_id || `temp-${Date.now()}`, // Fallback ID tạm thời
    song_id: song.song_id || song.id || `temp-${Date.now()}`,
    title: song.title || "Unknown Title",
    artist:
      typeof song.artist === "string" || !song.artist
        ? { artist_name: song.artist || song.artist_name || "Unknown Artist" }
        : { artist_name: song.artist.artist_name || "Unknown Artist" },
    image_url: song.image_url || song.cover || "/placeholder.svg",
    audio_url: song.audio_url || (song.song_id ? `/api/songs/${song.song_id}/stream/` : null),
    isPlaying: false,
    vinyl_background: song.vinyl_background || null,
    lyrics: song.lyrics || null,
  }

  // Kiểm tra tính hợp lệ của formatted song
  if (!formatted.audio_url) {
    console.warn(`Song ${formatted.song_id} missing audio_url:`, formatted)
  }
  if (!formatted.artist.artist_name) {
    console.warn(`Song ${formatted.song_id} missing artist_name:`, formatted)
  }

  return formatted
}, [])

  // Hàm phát bài hát
  const playSong = useCallback(
    async (song) => {
      if (!song) {
        setCurrentSong(null)
        if (audioRef.current) {
          // Cancel any pending play request
          if (playRequestRef.current) {
            playRequestRef.current.abort()
            playRequestRef.current = null
          }
          audioRef.current.pause()
          audioRef.current.src = ""
          setCurrentTime(0)
          setDuration(0)
        }
        setQueue((prevQueue) =>
          prevQueue.map((queuedSong) => ({
            ...queuedSong,
            isPlaying: false,
          })),
        )
        return
      }

      const formattedSong = formatSong(song)
      if (!isValidSong(formattedSong)) {
        console.error("Cannot play song:", formattedSong)
        return
      }

      // Update state first
      setCurrentSong({ ...formattedSong, isPlaying: true })
      setQueue((prevQueue) => {
        const updatedQueue = prevQueue.map((queuedSong) => ({
          ...queuedSong,
          isPlaying: queuedSong.song_id === formattedSong.song_id,
        }))
        const songExists = updatedQueue.some((queuedSong) => queuedSong.song_id === formattedSong.song_id)
        if (!songExists) {
          updatedQueue.push(formattedSong)
        }
        return updatedQueue
      })
      setIsPlayerExpanded(true)

      // Then handle audio playback
      if (audioRef.current) {
        try {
          // Cancel any pending play request
          if (playRequestRef.current) {
            playRequestRef.current.abort()
            playRequestRef.current = null
          }

          // Pause current playback
          audioRef.current.pause()

          // Set new source
          audioRef.current.src = formattedSong.audio_url
          audioRef.current.load()

          // Create new AbortController for this play request
          playRequestRef.current = new AbortController()

          // Wait a small amount of time to ensure the pause has completed
          await new Promise((resolve) => setTimeout(resolve, 50))

          // Play with the signal from AbortController
          await audioRef.current.play()

          // Reset currentTime after successful play
          setCurrentTime(0)

          // Clear the reference after successful play
          playRequestRef.current = null
        } catch (e) {
          // Only log errors that aren't from aborted requests
          if (e.name !== "AbortError") {
            console.error("Error playing audio:", e)
          }

          // If play failed (and wasn't aborted), update UI to reflect paused state
          if (e.name !== "AbortError") {
            setCurrentSong((prev) => (prev ? { ...prev, isPlaying: false } : null))
            setQueue((prevQueue) =>
              prevQueue.map((song) => ({
                ...song,
                isPlaying: false,
              })),
            )
          }
        }
      }
    },
    [formatSong, isValidSong],
  )

  // Hàm thêm bài hát vào queue
  const addToQueue = useCallback(
    (song) => {
      const formattedSong = formatSong(song)
      if (!isValidSong(formattedSong)) {
        console.error("Cannot add song to queue:", formattedSong)
        return
      }

      setQueue((prevQueue) => {
        const songExists = prevQueue.some((queuedSong) => queuedSong.song_id === formattedSong.song_id)
        if (!songExists) {
          return [...prevQueue, formattedSong]
        }
        return prevQueue
      })
    },
    [formatSong, isValidSong],
  )

  // Hàm phát bài hát tiếp theo trong queue
  const playNext = useCallback(
    (song) => {
      const formattedSong = formatSong(song)
      if (!isValidSong(formattedSong)) {
        console.error("Cannot add song to play next:", formattedSong)
        return
      }

      setQueue((prevQueue) => {
        const currentIndex = prevQueue.findIndex((item) => item.song_id === currentSong?.song_id)
        const existingIndex = prevQueue.findIndex((item) => item.song_id === formattedSong.song_id)
        const newQueue = [...prevQueue]

        if (existingIndex !== -1) {
          newQueue.splice(existingIndex, 1)
        }

        if (currentIndex !== -1) {
          newQueue.splice(currentIndex + 1, 0, formattedSong)
        } else {
          newQueue.push(formattedSong)
        }

        return newQueue
      })
    },
    [formatSong, currentSong, isValidSong],
  )

  // Hàm chuyển bài tiếp theo
  const handleNext = useCallback(() => {
    if (!queue.length) {
      setCurrentSong(null)
      setQueue([])
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
      return
    }

    const currentIndex = queue.findIndex((song) => song.song_id === currentSong?.song_id)
    let nextIndex

    if (shuffle) {
      const unplayedSongs = queue.filter((song) => !playedSongs.has(song.song_id))
      if (unplayedSongs.length > 0) {
        nextIndex = Math.floor(Math.random() * unplayedSongs.length)
        nextIndex = queue.findIndex((song) => song.song_id === unplayedSongs[nextIndex].song_id)
      } else {
        setPlayedSongs(new Set())
        const allPlayed = confirm("Đã phát hết nhạc trong playlist. Bạn có muốn phát lại không?")
        if (allPlayed) {
          nextIndex = Math.floor(Math.random() * queue.length)
        } else {
          setCurrentSong(null)
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ""
          }
          return
        }
      }
    } else {
      nextIndex = currentIndex + 1
      if (nextIndex >= queue.length) {
        if (repeat === "all") {
          nextIndex = 0
        } else {
          const allPlayed = confirm("Đã phát hết nhạc trong playlist. Bạn có muốn phát lại không?")
          if (allPlayed) {
            nextIndex = 0
          } else {
            setCurrentSong(null)
            if (audioRef.current) {
              audioRef.current.pause()
              audioRef.current.src = ""
            }
            return
          }
        }
      }
    }

    if (nextIndex >= 0 && nextIndex < queue.length) {
      playSong(queue[nextIndex])
      setPlayedSongs((prev) => new Set(prev).add(queue[nextIndex].song_id))
    }
  }, [queue, currentSong, shuffle, repeat, playSong, playedSongs])

  // Hàm chuyển bài trước đó
  const handlePrevious = useCallback(() => {
    if (!queue.length) return

    const currentIndex = queue.findIndex((song) => song.song_id === currentSong?.song_id)
    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      if (repeat === "all") {
        prevIndex = queue.length - 1
      } else {
        return
      }
    }

    if (prevIndex >= 0) {
      playSong(queue[prevIndex])
    }
  }, [queue, currentSong, repeat, playSong])

  // Lấy thông tin user từ URL hoặc localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const userParam = params.get("user")

    if (userParam) {
      try {
        const userData = JSON.parse(userParam)
        setCurrentUser(userData)
        localStorage.setItem("currentUser", JSON.stringify(userData))
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    } else {
      const savedUser = localStorage.getItem("currentUser")
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser))
        } catch (error) {
          console.error("Error parsing saved user:", error)
        }
      }
    }
  }, [])

  // Khôi phục queue từ localStorage - chỉ chạy một lần khi mount
  useEffect(() => {
    if (queueInitializedRef.current) return

    const savedQueue = localStorage.getItem("playingQueue")
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue)
        const validQueue = parsedQueue.filter(isValidSong)
        if (validQueue.length > 0) {
          setQueue(validQueue)
          queueInitializedRef.current = true
        }
      } catch (error) {
        console.error("Error parsing queue from localStorage:", error)
      }
    }
  }, [isValidSong])

  // Lưu queue vào localStorage khi thay đổi
  useEffect(() => {
    // Bỏ qua lần render đầu tiên
    if (!queueInitializedRef.current && queue.length === 0) return

    if (queue.length > 0) {
      localStorage.setItem("playingQueue", JSON.stringify(queue))
    } else {
      localStorage.removeItem("playingQueue")
    }

    // Đánh dấu đã khởi tạo
    queueInitializedRef.current = true
  }, [queue])

  // Cập nhật giao diện khi queue mở/đóng
  useEffect(() => {
    if (isQueueOpen) {
      document.body.classList.add("queue-open")
    } else {
      document.body.classList.remove("queue-open")
    }
    return () => {
      document.body.classList.remove("queue-open")
    }
  }, [isQueueOpen])

  // Đồng bộ volume với audioRef và lưu vào localStorage
  useEffect(() => {
    if (audioRef.current && Number.isFinite(volume)) {
      audioRef.current.volume = volume / 100
      localStorage.setItem("volume", volume)
    }
  }, [volume])

  // Xử lý sự kiện audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
    }

    const handleEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0
        // Use the same pattern as togglePlay for error handling
        audio.play().catch((e) => {
          if (e.name !== "AbortError") {
            console.error("Error replaying audio:", e)
            setCurrentSong((prev) => (prev ? { ...prev, isPlaying: false } : null))
            setQueue((prevQueue) =>
              prevQueue.map((song) => ({
                ...song,
                isPlaying: false,
              })),
            )
          }
        })
      } else {
        handleNext()
      }
    }

    const handlePause = () => {
      if (currentSong) {
        setCurrentSong((prev) => ({
          ...prev,
          isPlaying: false,
        }))
        setQueue((prevQueue) =>
          prevQueue.map((song) => ({
            ...song,
            isPlaying: false,
          })),
        )
      }
    }

    const handleError = (e) => {
      console.error("Audio error:", e)
      setCurrentSong((prev) => (prev ? { ...prev, isPlaying: false } : null))
      setQueue((prevQueue) =>
        prevQueue.map((song) => ({
          ...song,
          isPlaying: false,
        })),
      )
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("error", handleError)
    }
  }, [currentSong, handleNext, repeat])

  // Hàm xử lý tìm kiếm
  const handleSearch = useCallback((query, results) => {
    if (!query || typeof query !== "string") {
      setSearchQuery("")
      setSearchResults({ songs: [], albums: [], artists: [] })
      return
    }

    const validResults = {
      songs: Array.isArray(results?.songs) ? results.songs : [],
      albums: Array.isArray(results?.albums) ? results.albums : [],
      artists: Array.isArray(results?.artists) ? results.artists : [],
    }

    setSearchQuery(query)
    setSearchResults(validResults)
  }, [])

  // Hàm tua bài hát
  const handleSeek = useCallback(
    (newTime) => {
      if (audioRef.current && Number.isFinite(newTime) && newTime >= 0 && newTime <= duration) {
        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
      }
    },
    [duration],
  )

  // Hàm bật/tắt shuffle
  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev)
    if (!shuffle) setPlayedSongs(new Set())
  }, [shuffle])

  // Hàm bật/tắt repeat
  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => {
      if (prev === "off") return "all"
      if (prev === "all") return "one"
      return "off"
    })
  }, [])

  // Hàm bật/tắt phát nhạc
  const togglePlay = useCallback(async () => {
    if (currentSong && audioRef.current) {
      const audio = audioRef.current
      const newPlayingState = !currentSong.isPlaying

      // Update state first
      setCurrentSong((prev) => ({
        ...prev,
        isPlaying: newPlayingState,
      }))

      setQueue((prevQueue) =>
        prevQueue.map((song) => ({
          ...song,
          isPlaying: song.song_id === currentSong.song_id ? newPlayingState : false,
        })),
      )

      // Then handle audio
      if (newPlayingState) {
        try {
          // Cancel any pending play request
          if (playRequestRef.current) {
            playRequestRef.current.abort()
            playRequestRef.current = null
          }

          // Create new AbortController for this play request
          playRequestRef.current = new AbortController()

          // Play with the signal from AbortController
          await audio.play()

          // Clear the reference after successful play
          playRequestRef.current = null
        } catch (e) {
          // Only log errors that aren't from aborted requests
          if (e.name !== "AbortError") {
            console.error("Error playing audio:", e)

            // If play failed (and wasn't aborted), update UI to reflect paused state
            setCurrentSong((prev) => (prev ? { ...prev, isPlaying: false } : null))
            setQueue((prevQueue) =>
              prevQueue.map((song) => ({
                ...song,
                isPlaying: false,
              })),
            )
          }
        }
      } else {
        // Cancel any pending play request
        if (playRequestRef.current) {
          playRequestRef.current.abort()
          playRequestRef.current = null
        }
        audio.pause()
      }
    }
  }, [currentSong])

  // Hàm mở/đóng queue
  const toggleQueue = useCallback(() => {
    setIsQueueOpen((prev) => !prev)
  }, [])

  // Hàm mở/đóng player
  const togglePlayerExpand = useCallback(() => {
    setIsPlayerExpanded((prev) => !prev)
  }, [])

  // Hàm xử lý click vào album
  const handleAlbumClick = useCallback(
    (album) => {
      setSearchQuery("")
      navigate(`/album/${album.id}`)
    },
    [navigate],
  )

  // Hàm xử lý click vào artist
  const handleArtistClick = useCallback(
    (artist) => {
      setSearchQuery("")
      navigate(`/artist/${artist.id}`)
    },
    [navigate],
  )

  // Hàm xử lý click vào video
  const handleVideoClick = useCallback(
    (videoId) => {
      setSelectedVideoId(videoId)
      setShowVideoModal(true)

      // Pause audio if playing
      if (audioRef.current && currentSong?.isPlaying) {
        audioRef.current.pause()
        setCurrentSong((prev) => (prev ? { ...prev, isPlaying: false } : null))
        setQueue((prevQueue) =>
          prevQueue.map((song) => ({
            ...song,
            isPlaying: false,
          })),
        )
      }
    },
    [currentSong],
  )

  // Hàm đóng video modal
  const handleCloseVideoModal = useCallback(() => {
    setShowVideoModal(false)
    setSelectedVideoId(null)
  }, [])

  // Hàm quay lại trang trước
  const handleBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // Hàm xóa kết quả tìm kiếm
  const clearSearch = useCallback(() => {
    setSearchQuery("")
    setSearchResults({ songs: [], albums: [], artists: [] })
  }, [])

  // Hàm xử lý đề xuất bài hát từ chatbot
  const handleRecommendSong = useCallback(
    (songId) => {
      fetch(`/api/songs/${songId}`)
        .then((response) => response.json())
        .then((song) => {
          if (song) {
            playSong(song)
          }
        })
        .catch((error) => console.error("Error fetching recommended song:", error))
    },
    [playSong],
  )

  // Xử lý hẹn giờ
  const handleSetTimer = useCallback((hours, minutes) => {
    const totalSeconds = hours * 3600 + minutes * 60
    setTimer(totalSeconds)
    setShowTimerModal(false)
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown)
          if (audioRef.current) {
            // Cancel any pending play request
            if (playRequestRef.current) {
              playRequestRef.current.abort()
              playRequestRef.current = null
            }
            audioRef.current.pause()
            setCurrentSong((prev) => (prev ? { ...prev, isPlaying: false } : null))
            setQueue((prevQueue) =>
              prevQueue.map((song) => ({
                ...song,
                isPlaying: false,
              })),
            )
          }
          setTimer(null)
          alert("Thời gian hẹn đã hết. Nhạc đã dừng!")
          return null
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  return (
    <div className={`app2 ${isQueueOpen ? "with-queue" : ""}`}>
      <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
      {showFullScreen && isValidSong(currentSong) ? (
        <PlayingSong
          currentSong={currentSong}
          onClose={() => setShowFullScreen(false)}
          togglePlay={togglePlay}
          currentTime={currentTime}
          duration={duration}
          handleSeek={handleSeek}
          audioRef={audioRef}
          volume={volume}
          setVolume={setVolume}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
          shuffle={shuffle}
          toggleShuffle={toggleShuffle}
          repeat={repeat}
          toggleRepeat={toggleRepeat}
        />
      ) : (
        <>
          <Sidebar onClearSearch={clearSearch} />
          <main className={`main-content ${isQueueOpen ? "with-queue" : ""}`}>
            <Header onSearch={handleSearch} onClearSearch={clearSearch} />
            <div className={`content-container ${isQueueOpen ? "shrunk" : ""}`}>
              {searchQuery && searchResults && (
                <SearchResults
                  query={searchQuery}
                  playSong={playSong}
                  currentSong={currentSong}
                  onClearSearch={clearSearch}
                  addToQueue={addToQueue}
                  playNext={playNext}
                />
              )}
              {!searchQuery && (
                <Routes>
                  <Route
                    path="/"
                    element={
                      <>
                        <NewAlbums onAlbumClick={handleAlbumClick} />
                        <Artists onArtistClick={handleArtistClick} />
                        <Videos addToQueue={addToQueue} onVideoClick={handleVideoClick} />
                        <div className="content-grid">
                          <TopCharts
                            playSong={playSong}
                            currentSong={currentSong}
                            addToQueue={addToQueue}
                            playNext={playNext}
                          />
                          <Playlists />
                        </div>
                      </>
                    }
                  />
                  <Route
                    path="/album/:albumId"
                    element={
                      <AlbumDetail
                        onBack={handleBack}
                        playSong={playSong}
                        currentSong={currentSong}
                        addToQueue={addToQueue}
                        playNext={playNext}
                      />
                    }
                  />
                  <Route
                    path="/artist/:artistId"
                    element={
                      <ArtistDetail
                        onBack={handleBack}
                        playSong={playSong}
                        currentSong={currentSong}
                        addToQueue={addToQueue}
                        playNext={playNext}
                      />
                    }
                  />
                  <Route path="/albums" element={<AllAlbums onAlbumClick={handleAlbumClick} />} />
                  <Route path="/artists" element={<AllArtists onArtistClick={handleArtistClick} />} />
                  <Route
                    path="/songs"
                    element={
                      <Song playSong={playSong} currentSong={currentSong} addToQueue={addToQueue} playNext={playNext} />
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <HistoryPage
                        playSong={playSong}
                        currentSong={currentSong}
                        addToQueue={addToQueue}
                        playNext={playNext}
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
                        playNext={playNext}
                      />
                    }
                  />
                  <Route
                    path="/playlist/:playlist_number"
                    element={
                      <PlaylistDetail
                        playSong={playSong}
                        currentSong={currentSong}
                        addToQueue={addToQueue}
                        playNext={playNext}
                      />
                    }
                  />
                  <Route
                    path="/video/:videoId"
                    element={
                      <div className="video-page-container">
                        <button className="back-button" onClick={handleBack}>
                          Quay lại
                        </button>
                        <h1>Video</h1>
                        <p>Trang này sẽ hiển thị danh sách video</p>
                      </div>
                    }
                  />
                </Routes>
              )}
              <TimerModal
                isOpen={showTimerModal}
                onClose={() => setShowTimerModal(false)}
                onSetTimer={handleSetTimer}
              />
            </div>
          </main>
          <div
            className={`player-container ${isPlayerExpanded && isValidSong(currentSong) ? "expanded" : "collapsed"} ${
              isQueueOpen ? "shrunk" : ""
            }`}
          >
            {isValidSong(currentSong) && (
              <button
                className="toggle-player-button"
                onClick={togglePlayerExpand}
                aria-label={isPlayerExpanded ? "Collapse player" : "Expand player"}
              >
                {isPlayerExpanded ? "−" : "+"}
              </button>
            )}
            {isPlayerExpanded && isValidSong(currentSong) && (
              <Player
                currentSong={currentSong}
                setShowFullScreen={setShowFullScreen}
                toggleQueue={toggleQueue}
                audioRef={audioRef}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                setVolume={setVolume}
                handleNext={handleNext}
                handlePrevious={handlePrevious}
                togglePlay={togglePlay}
                shuffle={shuffle}
                toggleShuffle={toggleShuffle}
                repeat={repeat}
                toggleRepeat={toggleRepeat}
                handleSeek={handleSeek}
              />
            )}
          </div>
          <PlayingQueue
            songs={queue}
            currentSongId={currentSong?.song_id}
            isOpen={isQueueOpen}
            playSong={playSong}
            addToQueue={addToQueue}
            playNext={playNext}
            setQueue={setQueue}
            handleNext={handleNext}
            toggleTimerModal={() => setShowTimerModal(true)}
          />
          <ChatBot userId={currentUser?.user_id} currentSong={currentSong} onRecommendSong={handleRecommendSong} />
        </>
      )}
     
      {showVideoModal && selectedVideoId && <VideoDetail videoId={selectedVideoId} onClose={handleCloseVideoModal} />}
    </div>
  )
}

export default PageMain
