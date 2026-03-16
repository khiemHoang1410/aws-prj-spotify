"use client"
import { useState, useEffect, useCallback } from "react"
import { Play } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { debounce } from "lodash"
import SongActions from "../ui/SongActions"
import { SongHistoryService } from "../utils/SongHistoryService"
import { FavoriteService } from "../utils/FavoriteService"

function SearchResults({ query, playSong, currentSong, onClearSearch, addToQueue, playNext }) {
  const [results, setResults] = useState({ songs: [], albums: [], artists: [] })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [likedSongs, setLikedSongs] = useState({})
  const [selectedSongs, setSelectedSongs] = useState({})
  const [playlists, setPlaylists] = useState([])
  const [hoveredSong, setHoveredSong] = useState(null)
  const navigate = useNavigate()

  const formatSong = useCallback(
    (song) => ({
      song_id: song.song_id,
      title: song.title || "Unknown Title",
      artist: { artist_name: song.artist_name || "Unknown Artist" },
      image_url: song.image_url || "/placeholder.svg?height=48&width=48",
      duration: song.duration.includes(":")
        ? song.duration.split(":").reduce((acc, time) => 60 * acc + Number(time), 0)
        : song.duration || 0,
      audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
      isPlaying: true,
    }),
    [],
  )

  const updateQueue = useCallback((updateFn) => {
    const queue = JSON.parse(localStorage.getItem("playingQueue") || "[]")
    const updatedQueue = updateFn(queue)
    localStorage.setItem("playingQueue", JSON.stringify(updatedQueue))
  }, [])

  const fetchSearchResults = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.trim() === "") {
        setResults({ songs: [], albums: [], artists: [] })
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search/?query=${encodeURIComponent(searchQuery)}&limit=50`) // Giới hạn kết quả
        if (!response.ok) throw new Error("Search failed")
        const data = await response.json()

        const formattedResults = {
          songs: data.songs.map((song) => ({
            song_id: song.song_id,
            title: song.title,
            artist_name: song.artist_name,
            image_url: song.image_url || "/placeholder.svg?height=48&width=48",
            duration: formatDuration(song.duration),
            listeners: song.listeners,
            album: song.album_title,
            audio_url: `/api/songs/${song.song_id}/stream/`,
          })),
          albums: data.albums.map((album) => ({
            album_id: album.album_id,
            album_name: album.album_name,
            artist_name: album.artist_name,
            cover_url: album.cover_url || "/placeholder.svg?height=160&width=160",
            release_date: album.release_date,
          })),
          artists: data.artists.map((artist) => ({
            artist_id: artist.artist_id,
            artist_name: artist.artist_name,
            image_url: artist.image_url || "/placeholder.svg?height=180&width=180",
            nationality: artist.nationality,
          })),
        }

        setResults(formattedResults)

        const storedUser = localStorage.getItem("user")
        let likedStatus = {}
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            if (!userData.user_id) throw new Error("Invalid user data")
            const response = await fetch(`/api/users/${userData.user_id}/likes/`)
            if (!response.ok) throw new Error("Failed to fetch likes")
            const likedData = await response.json()
            const likedArray = Array.isArray(likedData) ? likedData : []
            likedStatus = Object.fromEntries(
              formattedResults.songs.map((song) => [
                song.song_id,
                likedArray.some((likedSong) => likedSong.song_id === song.song_id),
              ]),
            )
            Object.entries(likedStatus).forEach(([songId, isLiked]) => {
              localStorage.setItem(`liked_${songId}`, isLiked.toString())
            })
          } catch (error) {
            console.error("Error fetching likes:", error)
            localStorage.removeItem("user")
          }
        } else {
          likedStatus = Object.fromEntries(
            formattedResults.songs.map((song) => [song.song_id, localStorage.getItem(`liked_${song.song_id}`) === "true"]),
          )
        }
        setLikedSongs(likedStatus)
      } catch (error) {
        console.error("Search error:", error)
        setResults({ songs: [], albums: [], artists: [] })
      } finally {
        setLoading(false)
      }
    }, 200), // Giảm debounce xuống 200ms
    [],
  )

  useEffect(() => {
    console.log("Fetching search results for query:", query)
    fetchSearchResults(query)
  }, [query, fetchSearchResults])

  useEffect(() => {
    setPlaylists(JSON.parse(localStorage.getItem("playlists") || "[]"))
  }, [])

  useEffect(() => {
    const handleSongLikeChanged = (e) => {
      const songId = e.detail?.songId
      if (songId && results.songs.some((song) => song.song_id === songId)) {
        setLikedSongs((prev) => ({
          ...prev,
          [songId]: localStorage.getItem(`liked_${songId}`) === "true",
        }))
      }
    }
    window.addEventListener("songLikeChanged", handleSongLikeChanged)
    return () => window.removeEventListener("songLikeChanged", handleSongLikeChanged)
  }, [results.songs])

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const sortByRelevance = (items, key) => {
    if (!items || !Array.isArray(items) || items.length === 0) return []
    const searchTerms = query.toLowerCase().split(" ").filter((term) => term.length > 0)
    return [...items].sort((a, b) => {
      const aExactMatch = a[key]?.toLowerCase() === query.toLowerCase() ? 100 : 0
      const bExactMatch = b[key]?.toLowerCase() === query.toLowerCase() ? 100 : 0
      if (aExactMatch !== bExactMatch) return bExactMatch - aExactMatch
      const aStartsWith = a[key]?.toLowerCase().startsWith(query.toLowerCase()) ? 50 : 0
      const bStartsWith = b[key]?.toLowerCase().startsWith(query.toLowerCase()) ? 50 : 0
      if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith
      const aContainsAll = searchTerms.every((term) => a[key]?.toLowerCase().includes(term)) ? 25 : 0
      const bContainsAll = searchTerms.every((term) => b[key]?.toLowerCase().includes(term)) ? 25 : 0
      if (aContainsAll !== bContainsAll) return bContainsAll - aContainsAll
      const aTermMatches = searchTerms.filter((term) => a[key]?.toLowerCase().includes(term)).length
      const bTermMatches = searchTerms.filter((term) => b[key]?.toLowerCase().includes(term)).length
      if (aTermMatches !== bTermMatches) return bTermMatches - aTermMatches
      const aContains = a[key]?.toLowerCase().includes(query.toLowerCase()) ? 10 : 0
      const bContains = b[key]?.toLowerCase().includes(query.toLowerCase()) ? 10 : 0
      if (aContains !== bContains) return bContains - aContains
      return a[key]?.localeCompare(b[key] || "")
    })
  }

  const handleSongClick = (song) => {
    if (playSong) {
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
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          fetch(`/api/users/${userData.user_id}/listening_history/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userData.user_id, song: song.song_id, date: today, play_count: dailyPlays[today] }),
          }).catch((error) => console.error("Error saving to listening history:", error))
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }
    }
  }

  const handleArtistClick = (artist) => {
    if (onClearSearch) onClearSearch()
    navigate(`/artist/${artist.artist_id}`)
  }

  const handleAlbumClick = (album) => {
    if (onClearSearch) onClearSearch()
    navigate(`/album/${album.album_id}`)
  }

  const toggleLike = useCallback(
    (songId, event) => {
      event.stopPropagation()
      const song = results.songs.find((s) => s.song_id === songId)
      if (!song) {
        console.error("Song not found:", songId)
        return
      }
      const songData = formatSong(song)
      const newLiked = !likedSongs[songId]
      setLikedSongs((prev) => ({ ...prev, [songId]: newLiked }))
      FavoriteService.toggleFavorite(songData)
      FavoriteService.syncWithBackend(songId, newLiked).catch((error) => {
        console.error("Error updating like in DB:", error)
        setLikedSongs((prev) => ({ ...prev, [songId]: !newLiked }))
        FavoriteService.toggleFavorite(songData)
      })
    },
    [results.songs, likedSongs, formatSong],
  )

  const handleSongSelect = (songId, event) => {
    event.stopPropagation()
    setSelectedSongs((prev) => ({ ...prev, [songId]: !prev[songId] }))
  }

  const handleAddToQueue = useCallback(
    (song, event) => {
      event.stopPropagation()
      if (!song?.song_id) return
      const formattedSong = formatSong(song)
      if (addToQueue) {
        addToQueue(formattedSong)
      } else {
        updateQueue((queue) => {
          if (queue.some((item) => item.song_id === formattedSong.song_id)) return queue
          return [...queue, formattedSong]
        })
      }
    },
    [addToQueue, formatSong, updateQueue],
  )

  const handlePlayNext = useCallback(
    (song, event) => {
      event.stopPropagation()
      if (!song?.song_id) return
      const formattedSong = formatSong(song)
      if (playNext) {
        playNext(formattedSong)
      } else {
        updateQueue((queue) => {
          if (queue.some((item) => item.song_id === formattedSong.song_id)) return queue
          const index = queue.findIndex((item) => item.song_id === currentSong?.song_id)
          return index !== -1
            ? [...queue.slice(0, index + 1), formattedSong, ...queue.slice(index + 1)]
            : [formattedSong, ...queue]
        })
      }
    },
    [playNext, currentSong, formatSong, updateQueue],
  )

  const addToPlaylist = useCallback((song, playlistId, event) => {
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
  }, [formatSong])

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

  const filteredResults = () => {
    switch (activeTab) {
      case "songs":
        return { ...results, albums: [], artists: [] }
      case "artists":
        return { ...results, songs: [], albums: [] }
      case "albums":
        return { ...results, songs: [], artists: [] }
      default:
        return results
    }
  }

  const sortedResults = {
    songs: sortByRelevance(filteredResults().songs, "title"),
    albums: sortByRelevance(filteredResults().albums, "album_name"),
    artists: sortByRelevance(filteredResults().artists, "artist_name"),
  }

  if (!query || query.trim() === "") return null
  if (loading) return <div className="search-results-loading">Đang tìm kiếm...</div>

  return (
    <div className="search-results-container">
      <div className="search-tabs">
        <button className={`tab-button ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
          Tất cả
        </button>
        <button className={`tab-button ${activeTab === "songs" ? "active" : ""}`} onClick={() => setActiveTab("songs")}>
          Bài hát
        </button>
        <button className={`tab-button ${activeTab === "artists" ? "active" : ""}`} onClick={() => setActiveTab("artists")}>
          Nghệ sĩ
        </button>
        <button className={`tab-button ${activeTab === "albums" ? "active" : ""}`} onClick={() => setActiveTab("albums")}>
          Album
        </button>
      </div>
      <div className="search-results-content">
        {sortedResults.songs.length > 0 && (
          <section className="search-section">
            <h2 className="section-title">Kết quả hàng đầu</h2>
            <div className="top-result">
              <div className="top-result-item">
                <div className="top-result-image">
                  <img
                    src={sortedResults.songs[0].image_url || "/placeholder.svg?height=120&width=120"}
                    alt={sortedResults.songs[0].title}
                  />
                  <div className="play-overlay">
                    <button className="play-button" onClick={() => handleSongClick(sortedResults.songs[0])}>
                      <Play size={24} fill="black" />
                    </button>
                  </div>
                </div>
                <div className="top-result-info">
                  <h3 className="top-result-title">{sortedResults.songs[0].title}</h3>
                  <p className="top-result-artist">{sortedResults.songs[0].artist_name}</p>
                </div>
              </div>
            </div>
          </section>
        )}
        {sortedResults.songs.length > 0 && (
          <section className="search-section">
            <h2 className="section-title">Bài hát</h2>
            <div className="songs-list">
              {sortedResults.songs.map((song, index) => (
                <div
                  key={song.song_id}
                  className={`song-item ${currentSong?.song_id === song.song_id && currentSong?.isPlaying ? "playing" : ""}`}
                  onClick={() => handleSongClick(song)}
                  onMouseEnter={() => setHoveredSong(song.song_id)}
                  onMouseLeave={() => setHoveredSong(null)}
                >
                  <div className="song-index">
                    <span className={`song-index-number rank-${index < 3 ? index + 1 : "default"}`}>
                      {currentSong?.song_id === song.song_id && currentSong?.isPlaying ? "▶" : index + 1}
                    </span>
                    <div
                      className={`song-index-checkbox ${selectedSongs[song.song_id] ? "checked" : ""}`}
                      onClick={(e) => handleSongSelect(song.song_id, e)}
                    ></div>
                  </div>
                  <div className="song-cover">
                    <img src={song.image_url || "/placeholder.svg"} alt={song.title} />
                    <div className="song-cover-overlay">
                      <Play size={16} />
                    </div>
                  </div>
                  <div className="song-info">
                    <h3 className="song-title">{song.title}</h3>
                    <p className="song-artist">{song.artist_name}</p>
                  </div>
                  <span className="song-listeners">{song.listeners && song.listeners.toLocaleString()}</span>
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
                  <span className="song-duration">{song.duration}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        {sortedResults.artists.length > 0 && (
          <section className="search-section">
            <h2 className="section-title">Có sự xuất hiện của</h2>
            <div className="artists-grid">
              {sortedResults.artists.map((artist) => (
                <div key={artist.artist_id} className="artist-card" onClick={() => handleArtistClick(artist)}>
                  <div className="artist-cover">
                    <img src={artist.image_url || "/placeholder.svg"} alt={artist.artist_name} />
                    <div className="artist-overlay">
                      <button
                        className="play-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArtistClick(artist)
                        }}
                        aria-label={`Xem ${artist.artist_name}`}
                      >
                        <Play size={24} fill="black" />
                      </button>
                    </div>
                  </div>
                  <div className="artist-info">
                    <div className="artist-name">{artist.artist_name}</div>
                    <div className="artist-label">Nghệ sĩ</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {sortedResults.albums.length > 0 && (
          <section className="search-section">
            <h2 className="section-title">Album</h2>
            <div className="albums-grid">
              {sortedResults.albums.map((album) => (
                <div key={album.album_id} className="album-card" onClick={() => handleAlbumClick(album)}>
                  <div className="album-cover">
                    <img src={album.cover_url || "/placeholder.svg"} alt={album.album_name} />
                    <div className="album-overlay">
                      <button
                        className="play-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAlbumClick(album)
                        }}
                      >
                        <Play size={24} fill="black" />
                      </button>
                    </div>
                  </div>
                  <div className="album-info">
                    <div className="album-title">{album.album_name}</div>
                    <div className="album-artist">{album.artist_name}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {sortedResults.songs.length === 0 &&
          sortedResults.artists.length === 0 &&
          sortedResults.albums.length === 0 && (
            <div className="no-results">
              <p>Không tìm thấy kết quả nào cho "{query}"</p>
            </div>
          )}
      </div>
    </div>
  )
}

export default SearchResults