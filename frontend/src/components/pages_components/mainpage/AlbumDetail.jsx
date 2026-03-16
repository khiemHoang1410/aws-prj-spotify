// AlbumDetail.jsx
"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import SongItem from "../ui/SongItem"
import { SongHistoryService } from "../utils/SongHistoryService"
import { FavoriteService } from "../utils/FavoriteService"

function AlbumDetail({ playSong, currentSong, addToQueue, playNext }) {
  const { albumId } = useParams()
  const [album, setAlbum] = useState(null)
  const [songs, setSongs] = useState([])
  const [totalSongs, setTotalSongs] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playlists, setPlaylists] = useState([])
  const [likedSongs, setLikedSongs] = useState({})
  const pageSize = 5

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await fetch(`/api/albums/${albumId}/?song_limit=${pageSize}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        const songsList = Array.isArray(data.song_list) ? data.song_list : []
        const formattedAlbum = {
          album_id: data.album_id,
          album_name: data.album_name || "Unknown Album",
          artist_name: data.artist_name || "Unknown Artist",
          cover_url: data.cover_url || "/placeholder.svg",
          release_date: data.release_date || "Unknown Year",
          total_songs: data.total_songs || 0,
          duration: data.total_duration || 0,
        }
        setAlbum(formattedAlbum)
        setSongs(
          songsList.map((song) => ({
            song_id: song.song_id,
            title: song.title || "Unknown Title",
            duration: song.duration || 0,
            image_url: song.image_url || data.cover_url || "/placeholder.svg",
            audio_url: `/api/songs/${song.song_id}/stream/`,
            listeners: song.listeners || 0,
            vinyl_background: song.vinyl_background || null,
            lyrics: song.lyrics || null,
          })),
        )
        setTotalSongs(data.total_songs || 0)

        // Fetch user likes if logged in
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          const response = await fetch(`/api/users/${userData.user_id}/likes/`)
          const likedData = await response.json()

          // Ensure likedData is an array
          const likedArray = Array.isArray(likedData) ? likedData : []

          const likedStatus = Object.fromEntries(
            songsList.map((song) => [song.song_id, likedArray.some((likedSong) => likedSong.song_id === song.song_id)]),
          )
          setLikedSongs(likedStatus)
          Object.entries(likedStatus).forEach(([songId, isLiked]) => {
            localStorage.setItem(`liked_${songId}`, isLiked.toString())
          })
        } else {
          const likedStatus = Object.fromEntries(
            songsList.map((song) => [song.song_id, localStorage.getItem(`liked_${song.song_id}`) === "true"]),
          )
          setLikedSongs(likedStatus)
        }
      } catch (error) {
        console.error("Error fetching album:", error)
        setError(error.message || "Không thể tải thông tin album")
      } finally {
        setLoading(false)
      }
    }

    fetchAlbum()
    setPlaylists(JSON.parse(localStorage.getItem("playlists") || "[]"))
  }, [albumId])

  const loadMoreSongs = async () => {
    try {
      const nextPage = page + 1
      const response = await fetch(`/api/albums/${albumId}/songs/?page=${nextPage}&page_size=${pageSize}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      const newSongs = data.songs.map((song) => ({
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        duration: song.duration || 0,
        image_url: song.image_url || album.cover_url || "/placeholder.svg",
        audio_url: `/api/songs/${song.song_id}/stream/`,
        listeners: song.listeners || 0,
        vinyl_background: song.vinyl_background || null,
        lyrics: song.lyrics || null,
      }))
      setSongs((prev) => [...prev, ...newSongs])
      setPage(nextPage)
    } catch (error) {
      console.error("Error loading more songs:", error)
      setError(error.message)
    }
  }

  const handlePlaySong = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = {
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        artist: { artist_name: album?.artist_name || "Unknown Artist" },
        duration: song.duration || 0,
        image_url: song.image_url || album?.cover_url || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
        isPlaying: true,
        source: "album",
        sourceId: album?.album_id,
        sourceType: "album",
        album: {
          album_id: album?.album_id,
          album_name: album?.album_name,
          cover_url: album?.cover_url,
        },
        vinyl_background: song.vinyl_background,
        lyrics: song.lyrics,
      }
      playSong(formattedSong)

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]

      // Get existing history
      const existingHistory = SongHistoryService.getHistory()
      const existingSong = existingHistory.find((s) => s.song_id === song.song_id)

      // Update daily plays
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
    [album, playSong],
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

      // Chuẩn bị dữ liệu bài hát đầy đủ
      const songData = {
        song_id: songId,
        title: song.title || "Unknown Title",
        artist_name: album?.artist_name || "Unknown Artist",
        duration: song.duration || 0,
        image_url: song.image_url || album?.cover_url || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${songId}/stream/`,
      }

      // Cập nhật UI trước
      const newLiked = !likedSongs[songId]
      setLikedSongs((prev) => ({ ...prev, [songId]: newLiked }))

      // Sử dụng FavoriteService để cập nhật danh sách yêu thích
      FavoriteService.toggleFavorite(songData)

      // Đồng bộ với backend
      FavoriteService.syncWithBackend(songId, newLiked).catch((error) => {
        console.error("Error updating like in DB:", error)
        // Revert UI change if API call fails
        setLikedSongs((prev) => ({ ...prev, [songId]: !newLiked }))
        // Revert localStorage change
        FavoriteService.toggleFavorite(songData)
      })
    },
    [songs, likedSongs, album],
  )

  const handleAddToQueue = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = {
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        artist: { artist_name: album?.artist_name || "Unknown Artist" },
        duration: song.duration || 0,
        image_url: song.image_url || album?.cover_url || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
        album: {
          album_id: album?.album_id,
          album_name: album?.album_name,
          cover_url: album?.cover_url,
        },
      }
      addToQueue(formattedSong)
    },
    [addToQueue, album],
  )

  const handlePlayNext = useCallback(
    (song) => {
      if (!song?.song_id) return
      const formattedSong = {
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        artist: { artist_name: album?.artist_name || "Unknown Artist" },
        duration: song.duration || 0,
        image_url: song.image_url || album?.cover_url || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
        album: {
          album_id: album?.album_id,
          album_name: album?.album_name,
          cover_url: album?.cover_url,
        },
      }
      playNext(formattedSong)
    },
    [playNext, album],
  )

  const addToPlaylist = useCallback(
    (song, playlistId) => {
      const formattedSong = {
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        artist: { artist_name: album?.artist_name || "Unknown Artist" },
        duration: song.duration || 0,
        image_url: song.image_url || album?.cover_url || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
      }
      fetch(`/api/playlists/${playlistId}/songs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: song.song_id }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Failed to add song to playlist")
          return response.json()
        })
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
    [album],
  )

  const createNewPlaylist = useCallback(
    (song) => {
      const userId = localStorage.getItem("user_id")
      const formattedSong = {
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        artist: { artist_name: album?.artist_name || "Unknown Artist" },
        duration: song.duration || 0,
        image_url: song.image_url || album?.cover_url || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
      }
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
        .then((response) => {
          if (!response.ok) throw new Error("Failed to create playlist")
          return response.json()
        })
        .then((newPlaylist) => {
          fetch(`/api/playlists/${newPlaylist.playlist_id}/songs/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song_id: song.song_id }),
          })
            .then(() => {
              setPlaylists((prev) => {
                const updated = [...prev, { ...newPlaylist, songs: [formattedSong] }]
                localStorage.setItem("playlists", JSON.stringify(updated))
                return updated
              })
            })
            .catch((error) => console.error("Error adding song to new playlist:", error))
        })
        .catch((error) => console.error("Error creating playlist:", error))
    },
    [album, playlists.length],
  )

  const formatDuration = useCallback((duration) => {
    if (!duration) return "0:00"
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  if (loading) return <div className="album-detail-loading">Đang tải...</div>
  if (error) return <div className="album-detail-error">Lỗi: {error}</div>
  if (!album) return <div className="album-detail-error">Không tìm thấy album</div>

  return (
    <div className="album-detail-container">
      <div className="album-detail-cover">
        <img
          src={album.cover_url || "/placeholder.svg"}
          alt={`${album.album_name} cover`}
          className="album-detail-cover-image"
          loading="lazy"
          onError={(e) => (e.target.src = "/placeholder.svg")}
        />
      </div>

      <div className="album-detail-info">
        <h1 className="album-detail-title">{album.album_name}</h1>
        <p className="album-detail-artist">{album.artist_name}</p>
        <p className="album-detail-meta">
          {album.release_date.slice(0, 4)} • {album.total_songs} bài hát • {formatDuration(album.duration)}
        </p>
      </div>

      <div className="album-detail-songs">
        <h2 className="album-detail-section-title">Danh sách bài hát</h2>
        {songs.length > 0 ? (
          <div className="songs-list">
            {songs.map((song, index) => (
              <SongItem
                key={song.song_id}
                song={song}
                currentSong={currentSong}
                onPlay={handlePlaySong}
                addToQueue={handleAddToQueue}
                playNext={handlePlayNext}
                playlists={playlists}
                addToPlaylist={addToPlaylist}
                createNewPlaylist={createNewPlaylist}
                showIndex={true}
                index={index}
                showListeners={true}
                albumCover={album.cover_url}
                artistName={album.artist_name}
                isLiked={likedSongs[song.song_id]}
                toggleLike={toggleLike}
              />
            ))}
          </div>
        ) : (
          <p className="no-songs">Không có bài hát nào trong album.</p>
        )}
      </div>

      {songs.length < totalSongs && (
        <button className="see-more-button" onClick={loadMoreSongs}>
          Xem thêm
        </button>
      )}
    </div>
  )
}

export default AlbumDetail
