// Song.jsx
"use client"
import { useState, useEffect, useCallback } from "react"
import { Play } from "lucide-react"
import SongActions from "../ui/SongActions"
import { SongHistoryService } from "../utils/SongHistoryService"
import { FavoriteService } from "../utils/FavoriteService"

const Song = ({ playSong, currentSong, addToQueue, playNext }) => {
  const [songs, setSongs] = useState([])
  const [displayedSongs, setDisplayedSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [likedSongs, setLikedSongs] = useState({})
  const [playlists, setPlaylists] = useState([])
  const [hoveredSong, setHoveredSong] = useState(null)
  const [page, setPage] = useState(1)
  const songsPerPage = 10
  const maxSongs = 100

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch(`/api/songs/?limit=${maxSongs}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        const songsWithLiked = data.slice(0, maxSongs).map((song) => ({
          song_id: song.song_id,
          title: song.title || "Unknown Title",
          artist_name: song.artist_name || "Unknown Artist",
          image_url: song.image_url || "/placeholder.svg",
          duration: song.duration || 0,
          audio_url: `/api/songs/${song.song_id}/stream/`,
          listeners: song.listeners || 0,
          vinyl_background: song.vinyl_background || null,
          lyrics: song.lyrics || null,
        }))
        setSongs(songsWithLiked)
        setDisplayedSongs(songsWithLiked.slice(0, songsPerPage))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
    setPlaylists(JSON.parse(localStorage.getItem("playlists") || "[]"))

    // Fetch user likes if logged in
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      fetch(`/api/users/${userData.user_id}/likes/`)
        .then((response) => response.json())
        .then((likedData) => {
          const likedArray = Array.isArray(likedData) ? likedData : []
          const likedStatus = Object.fromEntries(
            songs.map((song) => [
              song.song_id,
              likedArray.some((likedSong) => likedSong.song_id === song.song_id),
            ]),
          )
          setLikedSongs(likedStatus)
          Object.entries(likedStatus).forEach(([songId, isLiked]) => {
            localStorage.setItem(`liked_${songId}`, isLiked.toString())
          })
        })
        .catch((err) => console.error("Error fetching likes:", err))
    } else {
      setLikedSongs(
        Object.fromEntries(
          songs.map((song) => [song.song_id, localStorage.getItem(`liked_${song.song_id}`) === "true"]),
        ),
      )
    }

    // Listen for songLikeChanged event
    const handleSongLikeChanged = () => {
      const updatedLikedSongs = Object.fromEntries(
        songs.map((song) => [song.song_id, localStorage.getItem(`liked_${song.song_id}`) === "true"]),
      )
      setLikedSongs(updatedLikedSongs)
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
      const song = songs.find((s) => s.song_id === songId)
      if (!song) {
        console.error("Song not found:", songId)
        return
      }
      const newLiked = !likedSongs[songId]
      setLikedSongs((prev) => ({ ...prev, [songId]: newLiked }))
      FavoriteService.toggleFavorite(song)
      FavoriteService.syncWithBackend(songId, newLiked).catch((error) => {
        console.error("Error updating like in DB:", error)
        setLikedSongs((prev) => ({ ...prev, [songId]: !newLiked }))
        FavoriteService.toggleFavorite(song)
      })
    },
    [songs, likedSongs],
  )

  const handleSongClick = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = formatSong(song)
      playSong(formattedSong)
      const today = new Date().toISOString().split("T")[0]
      const existingHistory = SongHistoryService.getHistory()
      const existingSong = existingHistory.find((s) => s.song_id === song.song_id)
      const dailyPlays = existingSong?.dailyPlays || {}
      dailyPlays[today] = (dailyPlays[today] || 0) + 1
      SongHistoryService.addToHistory({
        ...formattedSong,
        lastPlayed: new Date().toISOString(),
        playCount: (existingSong?.playCount || 0) + 1,
        dailyPlays,
        playDate: today,
      })
      const currentQueue = JSON.parse(localStorage.getItem("playingQueue") || "[]")
      const updatedQueue = currentQueue.some((s) => s.song_id === song.song_id)
        ? currentQueue
        : [...currentQueue, formattedSong]
      localStorage.setItem("playingQueue", JSON.stringify(updatedQueue))
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
      if (addToQueue) {
        addToQueue(formattedSong)
      } else {
        updateQueue((queue) => [...queue, formattedSong])
      }
    },
    [addToQueue, formatSong],
  )

  const handlePlayNext = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = formatSong(song)
      if (playNext) {
        playNext(formattedSong)
      } else {
        updateQueue((queue) => {
          const index = queue.findIndex((item) => item.song_id === currentSong?.song_id)
          return index !== -1
            ? [...queue.slice(0, index + 1), formattedSong, ...queue.slice(index + 1)]
            : [formattedSong, ...queue]
        })
      }
    },
    [playNext, currentSong, formatSong],
  )

  const updateQueue = useCallback((updateFn) => {
    const queue = JSON.parse(localStorage.getItem("playingQueue") || "[]")
    const updatedQueue = updateFn(queue)
    localStorage.setItem("playingQueue", JSON.stringify(updatedQueue))
  }, [])

  const addToPlaylist = useCallback(
    (song, playlistId, event) => {
      event.stopPropagation()
      const formattedSong = formatSong(song)
      fetch(`/api/playlists/${playlistId}/songs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: song.song_id }),
      })
        .then((response) => response.json())
        .then(() => {
          setPlaylists((prev) => {
            const updated = prev.map((p) =>
              p.id === playlistId && !p.songs.some((s) => s.song_id === song.song_id)
                ? { ...p, songs: [...p.songs, formattedSong] }
                : p,
            )
            localStorage.setItem("playlists", JSON.stringify(updated))
            return updated
          })
        })
        .catch((error) => console.error("Error adding to playlist:", error))
    },
    [formatSong],
  )

  const createNewPlaylist = useCallback(
    (song, event) => {
      event.stopPropagation()
      const userId = localStorage.getItem("user_id")
      const formattedSong = formatSong(song)
      fetch(`/api/playlists/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userId,
          playlist_name: `Playlist ${playlists.length + 1}`,
          playlist_type: "user",
          is_public: false,
        }),
      })
        .then((response) => response.json())
        .then((newPlaylist) => {
          fetch(`/api/playlists/${newPlaylist.playlist_id}/songs/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song_id: song.song_id }),
          }).then(() => {
            setPlaylists((prev) => {
              const updated = [...prev, { ...newPlaylist, songs: [formattedSong] }]
              localStorage.setItem("playlists", JSON.stringify(updated))
              return updated
            })
          })
        })
        .catch((error) => console.error("Error creating playlist:", error))
    },
    [formatSong, playlists.length],
  )

  const formatDuration = useCallback((duration) => {
    if (!duration) return "0:00"
    if (typeof duration === "string" && duration.includes(":")) return duration
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const loadMoreSongs = () => {
    const nextPage = page + 1
    const newDisplayedSongs = songs.slice(0, nextPage * songsPerPage)
    setDisplayedSongs(newDisplayedSongs)
    setPage(nextPage)
  }

  const hideSongs = () => {
    setDisplayedSongs(songs.slice(0, songsPerPage))
    setPage(1)
  }

  if (loading)
    return (
      <div className="song-page">
        <h2>Top Chart</h2>
        <div className="loading">Đang tải...</div>
      </div>
    )
  if (error)
    return (
      <div className="song-page">
        <h2>Top Chart</h2>
        <div className="error">Lỗi: {error}</div>
      </div>
    )

  return (
    <div className="song-page">
      <div className="section-header">
        <h2 className="section-title">Top Chart</h2>
      </div>
      <div className="songs-list-container">
        {displayedSongs.map((song, index) => (
          <div
            key={song.song_id}
            className={`song-item ${currentSong?.song_id === song.song_id ? "playing" : ""}`}
            onClick={() => handleSongClick(song)}
            onMouseEnter={() => setHoveredSong(song.song_id)}
            onMouseLeave={() => setHoveredSong(null)}
          >
            <div className="song-index">
              <span className={`song-index-number rank-${index < 3 ? index + 1 : "default"}`}>{index + 1}</span>
            </div>
            <div className="song-cover">
              <img src={song.image_url || "/placeholder.svg"} alt={song.title} />
              <div className="song-cover-overlay">
                <Play size={16} fill="white" />
              </div>
            </div>
            <div className="song-info">
              <h3 className="song-title">{song.title}</h3>
              <p className="song-artist">{song.artist_name}</p>
            </div>
            <span className="song-listeners">{song.listeners.toLocaleString()}</span>

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

            <span className="song-duration">{formatDuration(song.duration)}</span>
          </div>
        ))}
      </div>
      <div className="load-more-container">
        {displayedSongs.length < songs.length && displayedSongs.length < maxSongs && (
          <button className="load-more-button" onClick={loadMoreSongs}>
            Xem thêm
          </button>
        )}
        {displayedSongs.length >= songsPerPage && displayedSongs.length === songs.length && (
          <button className="load-more-button hide-button" onClick={hideSongs}>
            Ẩn bớt
          </button>
        )}
      </div>
      <style jsx>{`
        .load-more-container {
          display: flex;
          padding: 10px 0;
        }

        .load-more-button {
          padding: 8px 16px;
          background: none;
          border: none;
          color: #888;
          font-size: 14px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .load-more-button:hover {
          color: #ccc;
        }

        .hide-button {
          color: #888;
        }

        .hide-button:hover {
          color: #ccc;
        }
      `}</style>
    </div>
  )
}

export default Song