"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Clock, Calendar, Music, Trash2 } from "lucide-react"
import SongActions from "../ui/SongActions"
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import { vi } from "date-fns/locale"
import { SongHistoryService } from "../utils/SongHistoryService"
import { useNavigate } from "react-router-dom"
import LoginModal from "../ui/LoginModal"

function HistoryPage({ playSong, currentSong, addToQueue, playNext }) {
  const [historySongs, setHistorySongs] = useState([])
  const [likedSongs, setLikedSongs] = useState({})
  const [playlists, setPlaylists] = useState([])
  const [activeTab, setActiveTab] = useState("BÀI HÁT")
  const [groupBy, setGroupBy] = useState("day")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [hoveredSong, setHoveredSong] = useState(null)
  const navigate = useNavigate()

  // Tải lịch sử từ backend hoặc localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        fetch(`/api/users/${userData.user_id}/listening_history/`)
          .then((response) => response.json())
          .then((data) => {
            const formattedHistory = data.map((entry) => ({
              song_id: entry.song.song_id,
              title: entry.song.title,
              artist: entry.song.artist,
              artist_name: entry.song.artist_name,
              duration: entry.song.duration,
              image_url: entry.song.image_url,
              audio_url: entry.song.audio_url,
              lastPlayed: entry.listened_at,
              playCount: entry.play_count || 1,
              playDate: new Date(entry.listened_at).toISOString().split("T")[0],
            }))

            const historyByDate = {}
            formattedHistory.forEach((song) => {
              if (!historyByDate[song.playDate]) {
                historyByDate[song.playDate] = []
              }
              const existingIndex = historyByDate[song.playDate].findIndex((s) => s.song_id === song.song_id)
              if (existingIndex !== -1) {
                historyByDate[song.playDate][existingIndex].playCount += song.playCount
              } else {
                historyByDate[song.playDate].push(song)
              }
            })

            const sortedDates = Object.keys(historyByDate).sort((a, b) => new Date(b) - new Date(a))
            const finalHistory = []
            sortedDates.forEach((date) => {
              historyByDate[date].forEach((song) => {
                finalHistory.push({ ...song, playDate: date })
              })
            })

            setHistorySongs(finalHistory)
            setLoading(false)
          })
          .catch((error) => {
            console.error("Error fetching listening history:", error)
            const localHistory = SongHistoryService.getHistory()
            const today = new Date().toISOString().split("T")[0]
            const processedHistory = localHistory.map((song) => ({
              ...song,
              playDate: song.lastPlayed ? new Date(song.lastPlayed).toISOString().split("T")[0] : today,
            }))
            setHistorySongs(processedHistory)
            setLoading(false)
          })

        fetch(`/api/users/${userData.user_id}/likes/`)
          .then((response) => response.json())
          .then((data) => {
            const dataArray = Array.isArray(data) ? data : []
            const likedStatus = dataArray.reduce((obj, song) => {
              obj[song.song_id] = true
              return obj
            }, {})
            setLikedSongs(likedStatus)
          })
          .catch((error) => console.error("Error fetching liked songs:", error))

        fetch(`/api/users/${userData.user_id}/playlists/`)
          .then((response) => response.json())
          .then((data) => {
            setPlaylists(data || [])
          })
          .catch((error) => console.error("Error fetching playlists:", error))
      } catch (err) {
        console.error("Invalid user data:", err)
        localStorage.removeItem("user")
        setShowLoginModal(true)
        setLoading(false)
      }
    } else {
      const localHistory = SongHistoryService.getHistory()
      const today = new Date().toISOString().split("T")[0]
      const processedHistory = localHistory.map((song) => ({
        ...song,
        playDate: song.lastPlayed ? new Date(song.lastPlayed).toISOString().split("T")[0] : today,
      }))
      setHistorySongs(processedHistory)
      setShowLoginModal(true)
      setLoading(false)
    }

    const handleUserLogin = () => {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        fetch(`/api/users/${userData.user_id}/listening_history/`)
          .then((response) => response.json())
          .then((data) => {
            const formattedHistory = data.map((entry) => ({
              song_id: entry.song.song_id,
              title: entry.song.title,
              artist: entry.song.artist,
              artist_name: entry.song.artist_name,
              duration: entry.song.duration,
              image_url: entry.song.image_url,
              audio_url: entry.song.audio_url,
              lastPlayed: entry.listened_at,
              playCount: entry.play_count || 1,
              playDate: new Date(entry.listened_at).toISOString().split("T")[0],
            }))

            const historyByDate = {}
            formattedHistory.forEach((song) => {
              if (!historyByDate[song.playDate]) {
                historyByDate[song.playDate] = []
              }
              const existingIndex = historyByDate[song.playDate].findIndex((s) => s.song_id === song.song_id)
              if (existingIndex !== -1) {
                historyByDate[song.playDate][existingIndex].playCount += song.playCount
              } else {
                historyByDate[song.playDate].push(song)
              }
            })

            const sortedDates = Object.keys(historyByDate).sort((a, b) => new Date(b) - new Date(a))
            const finalHistory = []
            sortedDates.forEach((date) => {
              historyByDate[date].forEach((song) => {
                finalHistory.push({ ...song, playDate: date })
              })
            })

            setHistorySongs(finalHistory)
            setLoading(false)
          })
          .catch((error) => {
            console.error("Error fetching listening history:", error)
            setHistorySongs(SongHistoryService.getHistory())
            setLoading(false)
          })
      }
    }

    window.addEventListener("userLogin", handleUserLogin)
    return () => window.removeEventListener("userLogin", handleUserLogin)
  }, [])

  const clearHistory = useCallback(() => {
    SongHistoryService.clearHistory()
    setHistorySongs([])
  }, [])

  const formatSong = useCallback((song) => {
    if (!song || !song.song_id) {
      console.error("Invalid song data:", song)
      return null
    }

    return {
      song_id: song.song_id,
      title: song.title || "Unknown Title",
      artist: song.artist || { artist_name: song.artist_name || "Unknown Artist" },
      artist_name: song.artist?.artist_name || song.artist_name || "Unknown Artist",
      duration: song.duration || 0,
      image_url: song.image_url || song.cover || "/placeholder.svg",
      audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
      isPlaying: true,
      lastPlayed: song.lastPlayed || new Date().toISOString(),
      playCount: song.playCount || 1,
    }
  }, [])

  const toggleLike = useCallback(
    (songId, event) => {
      event.stopPropagation()
      const newLiked = !likedSongs[songId]
      setLikedSongs((prev) => ({ ...prev, [songId]: newLiked }))
      localStorage.setItem(`liked_${songId}`, newLiked.toString())

      let favorites = JSON.parse(localStorage.getItem("favoriteSongs") || "[]")
      const song = historySongs.find((s) => s.song_id === songId)
      if (newLiked && song) {
        if (!favorites.some((fav) => fav.song_id === songId)) {
          favorites.push({
            song_id: songId,
            title: song.title,
            artist_name: song.artist?.artist_name || song.artist_name,
            duration: song.duration,
            image_url: song.image_url || song.cover,
            audio_url: song.audio_url,
          })
        }
      } else {
        favorites = favorites.filter((fav) => fav.song_id !== songId)
      }
      localStorage.setItem("favoriteSongs", JSON.stringify(favorites))
      window.dispatchEvent(new CustomEvent("songLikeChanged"))

      if (user) {
        fetch(`/api/users/${user.user_id}/likes/`, {
          method: newLiked ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_id: songId }),
        }).catch((error) => console.error("Error updating like:", error))
      }
    },
    [likedSongs, historySongs, user]
  )

  const handlePlaySong = useCallback(
    (song) => {
      const formattedSong = formatSong(song)
      if (!formattedSong) return

      // Phát bài hát
      playSong(formattedSong)

      // Cập nhật lịch sử
      const today = new Date().toISOString().split("T")[0]
      const isTodaySong = song.playDate === today
      let updatedSong

      // Kiểm tra xem bài hát đã có trong lịch sử hôm nay chưa
      const existingTodaySong = historySongs.find(
        (s) => s.song_id === song.song_id && s.playDate === today
      )

      if (isTodaySong && existingTodaySong) {
        // Nếu bài hát đã có trong hôm nay, tăng playCount
        updatedSong = {
          ...existingTodaySong,
          lastPlayed: new Date().toISOString(),
          playCount: (existingTodaySong.playCount || 0) + 1,
        }
      } else {
        // Nếu bài hát không có trong hôm nay, tạo bản ghi mới
        updatedSong = {
          ...formattedSong,
          lastPlayed: new Date().toISOString(),
          playCount: existingTodaySong ? (existingTodaySong.playCount || 0) + 1 : 1,
          playDate: today,
        }
      }

      // Cập nhật SongHistoryService
      SongHistoryService.addToHistory(updatedSong)

      // Cập nhật historySongs
      setHistorySongs((prev) => {
        // Loại bỏ bản ghi cũ của bài hát trong hôm nay (nếu có)
        const filtered = prev.filter(
          (s) => !(s.song_id === song.song_id && s.playDate === today)
        )
        // Thêm bản ghi mới vào đầu danh sách
        return [updatedSong, ...filtered].sort(
          (a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
        )
      })

      // Cập nhật backend nếu người dùng đã đăng nhập
      if (user) {
        fetch(`/api/users/${user.user_id}/listening_history/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: user.user_id,
            song: song.song_id,
            date: today,
            play_count: updatedSong.playCount,
          }),
        }).catch((error) => console.error("Error updating listening history:", error))
      }
    },
    [playSong, formatSong, historySongs, user]
  )

  const handleAddToQueue = useCallback(
    (song, event) => {
      event.stopPropagation()
      const formattedSong = formatSong(song)
      if (!formattedSong) return
      addToQueue(formattedSong)
    },
    [addToQueue, formatSong]
  )

  const handlePlayNext = useCallback(
    (song, event) => {
      event.stopPropagation()
      const formattedSong = formatSong(song)
      if (!formattedSong) return
      playNext(formattedSong)
    },
    [playNext, formatSong]
  )

  const addToPlaylist = useCallback(
    (song, playlistId, event) => {
      event.stopPropagation()
      const formattedSong = formatSong(song)
      if (!formattedSong) return

      setPlaylists((prev) => {
        const updated = prev.map((p) =>
          p.user_playlist_id === playlistId && !p.songs.some((s) => s.song_id === song.song_id)
            ? { ...p, songs: [...p.songs, formattedSong] }
            : p
        )
        localStorage.setItem("playlists", JSON.stringify(updated))
        return updated
      })

      if (user) {
        fetch(`/api/users/${user.user_id}/playlists/${playlistId}/songs/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_id: song.song_id }),
        }).catch((error) => console.error("Error adding to playlist:", error))
      }
    },
    [formatSong, user]
  )

  const createNewPlaylist = useCallback(
    (song, event) => {
      event.stopPropagation()
      const formattedSong = formatSong(song)
      if (!formattedSong) return

      if (user) {
        fetch(`/api/users/${user.user_id}/playlists/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: user.user_id,
            playlist_name: `Playlist ${playlists.length + 1}`,
            is_public: false,
          }),
        })
          .then((response) => response.json())
          .then((newPlaylist) => {
            fetch(`/api/users/${user.user_id}/playlists/${newPlaylist.user_playlist_id}/songs/`, {
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
      }
    },
    [playlists.length, user, formatSong]
  )

  const formatDuration = useCallback((duration) => {
    if (!duration) return "0:00"
    if (typeof duration === "string" && duration.includes(":")) return duration
    const minutes = Math.floor(Number(duration) / 60)
    const seconds = Math.floor(Number(duration) % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const formatLastPlayed = useCallback((dateString) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return `Hôm nay, ${format(date, "HH:mm")}`
    } else if (isYesterday(date)) {
      return `Hôm qua, ${format(date, "HH:mm")}`
    } else if (isThisWeek(date)) {
      return formatDistanceToNow(date, { addSuffix: true, locale: vi })
    } else {
      return format(date, "dd/MM/yyyy HH:mm")
    }
  }, [])

  const groupSongsByTime = useCallback(() => {
    const groups = {}
    historySongs.forEach((song) => {
      const date = song.playDate || new Date(song.lastPlayed).toISOString().split("T")[0]
      let groupKey = ""
      if (groupBy === "day") {
        const songDate = new Date(date)
        if (isToday(songDate)) groupKey = "Hôm nay"
        else if (isYesterday(songDate)) groupKey = "Hôm qua"
        else if (isThisWeek(songDate)) groupKey = "Tuần này | " + format(songDate, "dd/MM/yyyy")
        else if (isThisMonth(songDate)) groupKey = "Tháng này | " + format(songDate, "dd/MM/yyyy")
        else groupKey = format(songDate, "dd/MM/yyyy")
      } else if (groupBy === "month") {
        groupKey = format(new Date(date), "MM/yyyy")
      } else if (groupBy === "year") {
        groupKey = format(new Date(date), "yyyy")
      }

      if (!groups[groupKey]) groups[groupKey] = []
      const existingIndex = groups[groupKey].findIndex((s) => s.song_id === song.song_id)
      if (existingIndex !== -1) {
        groups[groupKey][existingIndex].playCount += song.playCount || 1
      } else {
        groups[groupKey].push(song)
      }
    })
    return groups
  }, [historySongs, groupBy])

  const groupedSongs = groupSongsByTime()

  const handleLoginRedirect = () => {
    navigate("/login")
    setShowLoginModal(false)
  }

  const closeLoginModal = () => {
    setShowLoginModal(false)
    navigate("/main")
  }

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <LoginModal isOpen={showLoginModal} onClose={closeLoginModal} onLoginRedirect={handleLoginRedirect} />
      {!showLoginModal && (
        <>
          <div className="history-header">
            <h1 className="history-title">Phát gần đây</h1>
            <button className="clear-history-button" onClick={clearHistory}>
              <Trash2 size={16} /> Xóa lịch sử
            </button>

            <div className="history-tabs">
              <button
                className={`tab-button ${activeTab === "BÀI HÁT" ? "active" : ""}`}
                onClick={() => setActiveTab("BÀI HÁT")}
              >
                BÀI HÁT
              </button>
              <button
                className={`tab-button ${activeTab === "PLAYLIST" ? "active" : ""}`}
                onClick={() => setActiveTab("PLAYLIST")}
              >
                PLAYLIST
              </button>
            </div>
          </div>

          <div className="history-filter">
            <div className="filter-group">
              <button
                className={`filter-button ${groupBy === "day" ? "active" : ""}`}
                onClick={() => setGroupBy("day")}
              >
                <Calendar size={16} />
                <span>Theo ngày</span>
              </button>
              <button
                className={`filter-button ${groupBy === "month" ? "active" : ""}`}
                onClick={() => setGroupBy("month")}
              >
                <Calendar size={16} />
                <span>Theo tháng</span>
              </button>
              <button
                className={`filter-button ${groupBy === "year" ? "active" : ""}`}
                onClick={() => setGroupBy("year")}
              >
                <Calendar size={16} />
                <span>Theo năm</span>
              </button>
            </div>
          </div>

          <div className="history-content">
            {historySongs.length === 0 ? (
              <div className="empty-history">
                <Music size={48} />
                <p>Bạn chưa nghe bài hát nào gần đây</p>
              </div>
            ) : (
              Object.entries(groupedSongs).map(([timeGroup, songs]) => (
                <div key={timeGroup} className="history-group">
                  <h2 className="history-group-title">{timeGroup}</h2>
                  <div className="songs-list">
                    {songs.map((song) => (
                      <div
                        key={`${song.song_id}-${song.playDate}`}
                        className={`song-item ${currentSong?.song_id === song.song_id ? "playing" : ""}`}
                        onClick={() => handlePlaySong(song)}
                        onMouseEnter={() => setHoveredSong(song.song_id)}
                        onMouseLeave={() => setHoveredSong(null)}
                      >
                        <div className="song-cover">
                          <img src={song.image_url || song.cover || "/placeholder.svg"} alt={song.title} />
                          <div className="song-cover-overlay">
                            <Play size={16} />
                          </div>
                        </div>

                        <div className="song-info">
                          <h3 className="song-title">{song.title}</h3>
                          <p className="song-artist">
                            {song.artist?.artist_name || song.artist_name || "Unknown Artist"}
                          </p>
                        </div>

                        <div className="song-history-info">
                          <div className="song-play-count">
                            <Clock size={14} />
                            <span>{song.playCount} lần phát</span>
                          </div>
                          <div className="song-last-played">
                            <span>{formatLastPlayed(song.lastPlayed)}</span>
                          </div>
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

                        <span className="song-duration">{formatDuration(song.duration)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default HistoryPage