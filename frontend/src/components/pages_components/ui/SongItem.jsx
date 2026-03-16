// SongItem.jsx
"use client"
import { useState, useEffect, useCallback } from "react"
import { GripVertical, Play } from "lucide-react"
import SongActions from "../ui/SongActions"
import { SongHistoryService } from "../utils/SongHistoryService"
import { FavoriteService } from "../utils/FavoriteService"

const SongItem = ({
  song,
  currentSong,
  onPlay,
  addToQueue,
  playNext,
  playlists = [],
  addToPlaylist,
  createNewPlaylist,
  showIndex = false,
  index = 0,
  showListeners = false,
  showCheckbox = false,
  isSelected = false,
  onSelect,
  albumCover = null,
  artistName = null,
  isDraggable = false,
  onDragStart,
  onDragEnd,
  isInQueue = false,
  removeSongFromQueue,
}) => {
  const [hovered, setHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  // Kiểm tra trạng thái like khi component được tạo
  useEffect(() => {
    // Kiểm tra từ localStorage trước
    const liked = localStorage.getItem(`liked_${song.song_id}`) === "true"
    setIsLiked(liked)

    // Nếu người dùng đã đăng nhập, kiểm tra từ API
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        fetch(`/api/users/${userData.user_id}/likes/`)
          .then((response) => response.json())
          .then((data) => {
            // Ensure data is an array before using array methods
            const dataArray = Array.isArray(data) ? data : []
            const liked = dataArray.some((likedSong) => likedSong.song_id === song.song_id)
            setIsLiked(liked)
            localStorage.setItem(`liked_${song.song_id}`, liked.toString())
          })
          .catch((error) => {
            console.error("Error fetching liked songs:", error)
          })
      } catch (err) {
        console.error("Error parsing user data:", err)
      }
    }

    // Lắng nghe sự kiện thay đổi trạng thái like
    const handleSongLikeChanged = (event) => {
      // Chỉ cập nhật nếu sự kiện liên quan đến bài hát này
      if (event.detail?.songId === song.song_id || !event.detail) {
        const liked = localStorage.getItem(`liked_${song.song_id}`) === "true"
        setIsLiked(liked)
      }
    }

    window.addEventListener("songLikeChanged", handleSongLikeChanged)
    return () => window.removeEventListener("songLikeChanged", handleSongLikeChanged)
  }, [song.song_id])

  const formatDuration = useCallback((duration) => {
    if (!duration) return "0:00"
    if (typeof duration === "string" && duration.includes(":")) return duration
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const toggleLike = useCallback(
    (songId, event) => {
      event.stopPropagation()

      // Chuẩn bị dữ liệu bài hát đầy đủ
      const songData = {
        song_id: songId,
        title: song.title,
        artist_name: song.artist_name || song.artist?.artist_name || artistName || "Unknown Artist",
        duration: song.duration,
        image_url: song.image_url || albumCover || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${songId}/stream/`,
      }

      // Cập nhật UI trước
      const newLiked = !isLiked
      setIsLiked(newLiked)

      // Lưu vào localStorage và đồng bộ với backend
      try {
        // Cập nhật danh sách yêu thích
        FavoriteService.toggleFavorite(songData)

        // Đồng bộ với backend
        FavoriteService.syncWithBackend(songId, newLiked)
          .then((response) => {
            if (response && !response.ok) {
              throw new Error(`Failed to ${newLiked ? "like" : "unlike"} song`)
            }
            return response ? response.json() : null
          })
          .then((data) => {
            if (data) {
              console.log(`Song ${newLiked ? "liked" : "unliked"} successfully:`, data)
            }
          })
          .catch((error) => {
            console.error("Error updating like in DB:", error)
            // Revert the UI change if the API call fails
            setIsLiked(!newLiked)
            localStorage.setItem(`liked_${songId}`, (!newLiked).toString())

            // Cập nhật lại danh sách yêu thích
            FavoriteService.toggleFavorite(songData)
          })
      } catch (error) {
        console.error("Error toggling like:", error)
        setIsLiked(!newLiked)
      }
    },
    [isLiked, song, albumCover, artistName],
  )

  const handlePlay = useCallback(
    (event) => {
      event.stopPropagation()
      if (onPlay && song?.song_id) {
        const songData = {
          song_id: song.song_id,
          title: song.title || "Unknown Title",
          artist: {
            artist_name: song.artist_name || song.artist?.artist_name || artistName || "Unknown Artist",
          },
          duration: song.duration || 0,
          image_url: song.image_url || albumCover || "/placeholder.svg",
          audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
          isPlaying: true,
        }
        onPlay(songData)

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split("T")[0]

        // Add to history with daily play tracking
        const existingHistory = SongHistoryService.getHistory()
        const existingSong = existingHistory.find((s) => s.song_id === song.song_id)

        const dailyPlays = existingSong?.dailyPlays || {}
        dailyPlays[today] = (dailyPlays[today] || 0) + 1

        SongHistoryService.addToHistory({
          ...songData,
          lastPlayed: new Date().toISOString(),
          playCount: (existingSong?.playCount || 0) + 1,
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
                song: song.song_id,
                date: today,
                play_count: dailyPlays[today],
              }),
            }).catch((error) => console.error("Error updating listening history:", error))
          } catch (err) {
            console.error("Error parsing user data:", err)
          }
        }
      }
    },
    [song, onPlay, albumCover, artistName],
  )

  const coverImage = song.image_url || albumCover || "/placeholder.svg"
  const displayArtistName =
    song.artist_name || (song.artist && song.artist.artist_name) || artistName || "Unknown Artist"

  const isPlaying = currentSong?.song_id === song?.song_id && currentSong?.isPlaying

  // Tạo một hàm riêng để xử lý addToQueue, không cập nhật state trực tiếp
  const handleAddToQueue = useCallback(
    (songToAdd) => {
      if (addToQueue) {
        addToQueue(songToAdd)

        // Cập nhật PlayingQueue trong localStorage
        try {
          const currentQueue = JSON.parse(localStorage.getItem("playingQueue") || "[]")
          const updatedQueue = [...currentQueue, songToAdd]
          localStorage.setItem("playingQueue", JSON.stringify(updatedQueue))
          window.dispatchEvent(new Event("storage"))
        } catch (error) {
          console.error("Error updating queue in localStorage:", error)
        }
      }
    },
    [addToQueue],
  )

  return (
    <div
      className={`song-item ${isPlaying ? "playing" : ""} ${isDraggable ? "draggable" : ""}`}
      onClick={handlePlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-song-id={song.song_id}
    >
      {isDraggable && (
        <div className="song-drag-handle">
          <GripVertical size={16} className="drag-icon" />
        </div>
      )}

      {showIndex && (
        <div className="song-index">
          <span className={`song-index-number ${index < 3 ? `rank-${index + 1}` : "rank-default"}`}>
            {isPlaying ? "▶" : index + 1}
          </span>
          {showCheckbox && <div className={`song-index-checkbox ${isSelected ? "checked" : ""}`}></div>}
        </div>
      )}

      <div className="song-cover">
        <img src={coverImage || "/placeholder.svg"} alt={song.title} loading="lazy" />
        <div className="song-cover-overlay">
          <Play size={16} />
        </div>
      </div>

      <div className="song-info">
        <h3 className="song-title">{song.title}</h3>
        <p className="song-artist">{displayArtistName}</p>
      </div>

      {showListeners && song.listeners && <span className="song-listeners">{song.listeners.toLocaleString()}</span>}

      {hovered && (
        <SongActions
          song={song}
          isLiked={isLiked}
          toggleLike={toggleLike}
          addToQueue={handleAddToQueue}
          playNext={playNext}
          playlists={playlists}
          addToPlaylist={addToPlaylist}
          createNewPlaylist={createNewPlaylist}
          isInQueue={isInQueue}
          removeSongFromQueue={removeSongFromQueue}
        />
      )}

      <div className="song-duration">{formatDuration(song.duration)}</div>
    </div>
  )
}

export default SongItem
