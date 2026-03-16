"use client"
import { useState, useEffect, useCallback } from "react"
import { Play, Music } from "lucide-react"
import SongActions from "../ui/SongActions"
import { SongHistoryService } from "../utils/SongHistoryService"
import { FavoriteService } from "../utils/FavoriteService"

function FavoritePage({ playSong, currentSong, addToQueue, playNext }) {
  const [favoriteSongs, setFavoriteSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playlists, setPlaylists] = useState([])
  const [hoveredSong, setHoveredSong] = useState(null)
  const [likedSongs, setLikedSongs] = useState({})

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true)

        // Lấy danh sách bài hát yêu thích từ localStorage
        const favorites = FavoriteService.getFavorites()
        setFavoriteSongs(favorites)

        // Khởi tạo trạng thái like cho tất cả bài hát
        const initialLikedStatus = Object.fromEntries(favorites.map((song) => [song.song_id, true]))
        setLikedSongs(initialLikedStatus)

        // Lấy danh sách playlist
        setPlaylists(JSON.parse(localStorage.getItem("playlists") || "[]"))

        // Nếu người dùng đã đăng nhập, đồng bộ với backend
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            const response = await fetch(`/api/users/${userData.user_id}/likes/`)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const likedData = await response.json()

            // Đảm bảo likedData.songs là một mảng
            const likedSongs = Array.isArray(likedData.songs) ? likedData.songs : []

            // Cập nhật danh sách bài hát yêu thích từ API
            if (likedSongs.length > 0) {
              const formattedLikedSongs = likedSongs.map((song) => ({
                song_id: song.song_id,
                title: song.title || "Unknown Title",
                artist_name: song.artist_name || "Unknown Artist",
                image_url: song.image_url || "/placeholder.svg",
                duration: song.duration || 0,
                audio_url: `/api/songs/${song.song_id}/stream/`,
              }))

              // Cập nhật danh sách yêu thích
              setFavoriteSongs(formattedLikedSongs)
              localStorage.setItem("favoriteSongs", JSON.stringify(formattedLikedSongs))

              // Cập nhật trạng thái like
              const updatedLikedStatus = Object.fromEntries(formattedLikedSongs.map((song) => [song.song_id, true]))
              setLikedSongs(updatedLikedStatus)
            }
          } catch (error) {
            console.error("Error fetching likes from API:", error)
          }
        }
      } catch (error) {
        console.error("Error loading favorites:", error)
        setError("Không thể tải danh sách bài hát yêu thích")
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()

    // Lắng nghe sự kiện thay đổi trạng thái like
    const handleSongLikeChanged = () => {
      const favorites = FavoriteService.getFavorites()
      setFavoriteSongs(favorites)

      const updatedLikedStatus = Object.fromEntries(favorites.map((song) => [song.song_id, true]))
      setLikedSongs(updatedLikedStatus)
    }

    window.addEventListener("songLikeChanged", handleSongLikeChanged)
    return () => window.removeEventListener("songLikeChanged", handleSongLikeChanged)
  }, [])

  const formatSong = useCallback(
    (song) => ({
      song_id: song.song_id,
      title: song.title || "Unknown Title",
      artist: { artist_name: song.artist_name || "Unknown Artist" },
      duration: song.duration || 0,
      image_url: song.image_url || "/placeholder.svg",
      audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
      isPlaying: true,
    }),
    [],
  )

  const toggleLike = useCallback(
    (songId, event) => {
      event.stopPropagation()

      // Tìm bài hát trong danh sách
      const song = favoriteSongs.find((s) => s.song_id === songId)
      if (!song) {
        console.error("Song not found:", songId)
        return
      }

      // Cập nhật UI trước
      const newLiked = !likedSongs[songId]
      setLikedSongs((prev) => ({ ...prev, [songId]: newLiked }))

      // Sử dụng FavoriteService để cập nhật danh sách yêu thích
      FavoriteService.toggleFavorite(song)

      // Cập nhật danh sách bài hát yêu thích
      if (!newLiked) {
        setFavoriteSongs((prev) => prev.filter((s) => s.song_id !== songId))
      }

      // Đồng bộ với backend
      FavoriteService.syncWithBackend(songId, newLiked).catch((error) => {
        console.error("Error updating like in DB:", error)
        // Revert UI change if API call fails
        setLikedSongs((prev) => ({ ...prev, [songId]: !newLiked }))
        // Revert localStorage change
        FavoriteService.toggleFavorite(song)
        // Revert favorites list
        if (!newLiked) {
          setFavoriteSongs(FavoriteService.getFavorites())
        }
      })
    },
    [favoriteSongs, likedSongs],
  )

  const handlePlaySong = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = formatSong(song)
      playSong(formattedSong)

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]

      // Add to history with daily play tracking
      const existingHistory = SongHistoryService.getHistory()
      const existingSong = existingHistory.find((s) => s.song_id === song.song_id)

      const dailyPlays = existingSong?.dailyPlays || {}
      dailyPlays[today] = (dailyPlays[today] || 0) + 1

      SongHistoryService.addToHistory({
        ...formattedSong,
        lastPlayed: new Date().toISOString(),
        playCount: (existingSong?.playCount || 0) + 1,
        dailyPlays: dailyPlays,
        playDate: today,
      })

      const storedUser = localStorage.getItem("user")
      if (storedUser) {
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
        }).catch((error) => console.error("Error saving to listening history:", error))
      }
    },
    [playSong, formatSong],
  )

  const handleAddToQueue = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = formatSong(song)
      addToQueue(formattedSong)

      // Cập nhật PlayingQueue trong localStorage
      try {
        const currentQueue = JSON.parse(localStorage.getItem("playingQueue") || "[]")
        const updatedQueue = [...currentQueue, formattedSong]
        localStorage.setItem("playingQueue", JSON.stringify(updatedQueue))
        window.dispatchEvent(new Event("storage"))
      } catch (error) {
        console.error("Error updating queue in localStorage:", error)
      }
    },
    [addToQueue, formatSong],
  )

  const handlePlayNext = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = formatSong(song)
      playNext(formattedSong)
    },
    [playNext, formatSong],
  )

  const addToPlaylist = useCallback((song, playlistId, event) => {
    event.stopPropagation()
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      console.error("User not logged in")
      return
    }
    const userData = JSON.parse(storedUser)
    fetch(`/api/users/${userData.user_id}/playlists/${playlistId}/songs/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_id: song.song_id }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(errorData.message || "Failed to add song to playlist")
          })
        }
        return response.json()
      })
      .then(() => {
        // Fetch updated playlists to sync
        fetch(`/api/users/${userData.user_id}/playlists/`)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch updated playlists")
            return res.json()
          })
          .then((updatedPlaylists) => {
            setPlaylists(updatedPlaylists)
            localStorage.setItem("playlists", JSON.stringify(updatedPlaylists))
          })
      })
      .catch((error) => console.error("Error adding to playlist:", error))
  }, [])

  const createNewPlaylist = useCallback(
    (song, event) => {
      event.stopPropagation()
      const storedUser = localStorage.getItem("user")
      if (!storedUser) {
        console.error("User not logged in")
        return
      }
      const userData = JSON.parse(storedUser)
      fetch(`/api/users/${userData.user_id}/playlists/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userData.user_id,
          playlist_name: `Playlist ${playlists.length + 1}`,
          is_public: false,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((errorData) => {
              throw new Error(errorData.message || "Failed to create playlist")
            })
          }
          return response.json()
        })
        .then((newPlaylist) => {
          fetch(`/api/users/${userData.user_id}/playlists/${newPlaylist.playlist_number}/songs/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song_id: song.song_id }),
          })
            .then((response) => {
              if (!response.ok) throw new Error("Failed to add song to new playlist")
              return response.json()
            })
            .then(() => {
              // Fetch updated playlists to sync
              fetch(`/api/users/${userData.user_id}/playlists/`)
                .then((res) => {
                  if (!res.ok) throw new Error("Failed to fetch updated playlists")
                  return res.json()
                })
                .then((updatedPlaylists) => {
                  setPlaylists(updatedPlaylists)
                  localStorage.setItem("playlists", JSON.stringify(updatedPlaylists))
                })
            })
        })
        .catch((error) => console.error("Error creating playlist:", error))
    },
    [playlists.length],
  )

  const formatDuration = useCallback((duration) => {
    if (!duration) return "0:00"
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  if (loading) {
    return <div className="favorite-page-loading">Đang tải...</div>
  }
  if (error) {
    return <div className="favorite-page-error">Lỗi: {error}</div>
  }

  if (!favoriteSongs.length) {
    return (
      <div className="favorite-page">
        <div className="section-header">
          <h2 className="section-title">Bài hát yêu thích</h2>
        </div>
        <div className="empty-favorites">
          <div className="empty-icon">
            <Music size={48} />
          </div>
          <p className="empty-text">Chưa có bài hát yêu thích trong thư viện cá nhân</p>
          <button className="explore-button" onClick={() => navigate("/main/songs")}>
            KHÁM PHÁ NGAY
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="favorite-page">
      <div className="section-header">
        <h2 className="section-title">Bài hát yêu thích</h2>
      </div>
      <div className="songs-list">
        {favoriteSongs.map((song, index) => (
          <div
            key={song.song_id}
            className={`song-item ${currentSong?.song_id === song.song_id ? "playing" : ""}`}
            onClick={() => handlePlaySong(song)}
            onMouseEnter={() => setHoveredSong(song.song_id)}
            onMouseLeave={() => setHoveredSong(null)}
          >
            <div className="song-index">
              <span className={`song-index-number rank-${index < 3 ? index + 1 : "default"}`}>
                {currentSong?.song_id === song.song_id && currentSong?.isPlaying ? "▶" : index + 1}
              </span>
            </div>
            <div className="song-cover">
              <img src={song.image_url || "/placeholder.svg"} alt={song.title} loading="lazy" />
              <div className="song-cover-overlay">
                <Play size={16} />
              </div>
            </div>
            <div className="song-info">
              <h3 className="song-title">{song.title}</h3>
              <p className="song-artist">{song.artist_name}</p>
            </div>

            {hoveredSong === song.song_id && (
              <SongActions
                song={song}
                isLiked={likedSongs[song.song_id]}
                toggleLike={toggleLike}
                addToQueue={handleAddToQueue}
                playNext={handlePlayNext}
                playlists={playlists}
                addToPlaylist={addToPlaylist}
                createNewPlaylist={createNewPlaylist}
              />
            )}

            <div className="song-duration">{formatDuration(song.duration)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FavoritePage
