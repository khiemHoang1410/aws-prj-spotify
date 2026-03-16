"use client"
import { useState, useEffect, useCallback } from "react"
import { Play } from "lucide-react"
import SongActions from "../ui/SongActions"
import { SongHistoryService } from "../utils/SongHistoryService"
import { FavoriteService } from "../utils/FavoriteService"

function TopCharts({ playSong, currentSong, addToQueue, playNext }) {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playlists, setPlaylists] = useState([])
  const [hoveredSong, setHoveredSong] = useState(null)
  const [likedSongs, setLikedSongs] = useState({})

  // Fetch with retry logic
  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          const text = await response.text()
          let errorData
          try {
            errorData = JSON.parse(text)
          } catch {
            errorData = { error: `HTTP error! status: ${response.status}`, details: text || "No response body" }
          }
          throw new Error(`${errorData.error}: ${errorData.details || "No details"}`)
        }
        return await response.json()
      } catch (error) {
        if (i === retries - 1) throw error
        console.warn(`Retry ${i + 1}/${retries} for ${url}: ${error.message}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // Fetch top songs and playlists on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top songs
        const songsData = await fetchWithRetry("/api/top-songs/", {
          headers: { "Content-Type": "application/json" },
        })
        const formattedSongs = songsData.map((song) => ({
          song_id: song.song_id,
          title: song.title || "Unknown Title",
          artist_name: song.artist_name || "Unknown Artist",
          image_url: song.image_url || "/placeholder.svg",
          duration: song.duration || 0,
          audio_url: `/api/songs/${song.song_id}/stream/`,
        }))
        setSongs(formattedSongs)

        // Lấy danh sách bài hát yêu thích từ localStorage
        const favorites = FavoriteService.getFavorites()
        const initialLikedStatus = Object.fromEntries(
          formattedSongs.map((song) => [song.song_id, favorites.some((fav) => fav.song_id === song.song_id)]),
        )
        setLikedSongs(initialLikedStatus)

        // Fetch user likes and playlists if logged in
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            // Fetch likes
            const likedData = await fetchWithRetry(`/api/users/${userData.user_id}/likes/`, {
              headers: { "Content-Type": "application/json" },
            })

            // Đảm bảo likedData.songs là một mảng
            const likedSongs = Array.isArray(likedData.songs) ? likedData.songs : []

            // Cập nhật trạng thái like từ API
            const likedStatus = Object.fromEntries(
              formattedSongs.map((song) => [
                song.song_id,
                likedSongs.some((likedSong) => likedSong.song_id === song.song_id),
              ]),
            )
            setLikedSongs(likedStatus)

            // Cập nhật localStorage để đồng bộ
            Object.entries(likedStatus).forEach(([songId, isLiked]) => {
              localStorage.setItem(`liked_${songId}`, isLiked.toString())
            })

            // Cập nhật danh sách bài hát yêu thích trong localStorage
            const updatedFavorites = formattedSongs.filter((song) => likedStatus[song.song_id])
            localStorage.setItem("favoriteSongs", JSON.stringify(updatedFavorites))

            // Fetch playlists
            const playlistData = await fetchWithRetry(`/api/users/${userData.user_id}/playlists/`, {
              headers: { "Content-Type": "application/json" },
            })
            setPlaylists(playlistData)
            localStorage.setItem("playlists", JSON.stringify(playlistData))
          } catch (error) {
            console.error("Error fetching user data:", error)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle song like changes
  useEffect(() => {
    const handleSongLikeChanged = (event) => {
      // Nếu có songId cụ thể, chỉ cập nhật bài hát đó
      if (event.detail?.songId) {
        const songId = event.detail.songId
        if (songs.some((song) => song.song_id === songId)) {
          setLikedSongs((prev) => ({
            ...prev,
            [songId]: localStorage.getItem(`liked_${songId}`) === "true",
          }))
        }
      } else {
        // Nếu không có songId cụ thể, cập nhật tất cả
        const updatedLikedSongs = Object.fromEntries(
          songs.map((song) => [song.song_id, localStorage.getItem(`liked_${song.song_id}`) === "true"]),
        )
        setLikedSongs(updatedLikedSongs)
      }
    }

    window.addEventListener("songLikeChanged", handleSongLikeChanged)
    return () => window.removeEventListener("songLikeChanged", handleSongLikeChanged)
  }, [songs])

  const formatSong = useCallback(
    (song) => ({
      song_id: song.song_id,
      title: song.title || "Unknown Title",
      artist: { artist_name: song.artist_name || "Unknown Artist" },
      duration: song.duration || 0,
      image_url: song.image_url || "/placeholder.svg",
      audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
      isPlaying: true,
      vinyl_background: song.vinyl_background || null,
      lyrics: song.lyrics || null,
    }),
    [],
  )

  const toggleLike = useCallback(
    (songId, event) => {
      event.stopPropagation()

      // Tìm bài hát trong danh sách
      const song = songs.find((s) => s.song_id === songId)
      if (!song) {
        console.error("Song not found:", songId)
        return
      }

      // Cập nhật UI trước
      const newLiked = !likedSongs[songId]
      setLikedSongs((prev) => ({ ...prev, [songId]: newLiked }))

      // Sử dụng FavoriteService để cập nhật danh sách yêu thích
      FavoriteService.toggleFavorite(song)

      // Đồng bộ với backend
      FavoriteService.syncWithBackend(songId, newLiked).catch((error) => {
        console.error("Error updating like in DB:", error)
        // Revert UI change if API call fails
        setLikedSongs((prev) => ({ ...prev, [songId]: !newLiked }))
        // Revert localStorage change
        FavoriteService.toggleFavorite(song)
      })
    },
    [songs, likedSongs],
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

  // Tạo một hàm riêng để xử lý addToQueue, không cập nhật state trực tiếp
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
    return <div className="top-charts-loading">Đang tải...</div>
  }
  if (error) {
    return <div className="top-charts-error">Lỗi: {error}</div>
  }

  const displayedSongs = songs.slice(0, 7)

  if (!displayedSongs.length) {
    return (
      <section className="top-charts">
        <div className="section-header">
          <h2 className="section-title">Top Charts</h2>
          <a href="/main/top-charts" className="see-all">
            Xem tất cả
          </a>
        </div>
        <p>Không có bài hát nào.</p>
      </section>
    )
  }

  return (
    <section className="top-charts">
      <div className="section-header">
        <h2 className="section-title">Top Charts</h2>
      </div>
      <div className="songs-list">
        {songs.map((song) => (
          <div
            key={song.song_id}
            className={`song-item ${currentSong?.song_id === song.song_id ? "playing" : ""}`}
            onClick={() => handlePlaySong(song)}
            onMouseEnter={() => setHoveredSong(song.song_id)}
            onMouseLeave={() => setHoveredSong(null)}
          >
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
    </section>
  )
}

export default TopCharts
