"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Heart, MoreHorizontal } from "lucide-react"
import DropdownMenu from "./DropdownMenu"
import PlaylistSubmenu from "./PlaylistSubmenu"
import LoginModal from "../ui/LoginModal"

const SongActions = ({
  song,
  isLiked,
  toggleLike,
  addToQueue,
  playNext,
  playlists: initialPlaylists = [],
  addToPlaylist,
  createNewPlaylist,
  isInQueue = false,
  removeSongFromQueue,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [playlistMenuPosition, setPlaylistMenuPosition] = useState({ top: 0, left: 0 })
  const [playlists, setPlaylists] = useState(initialPlaylists)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [playlistSongsCache, setPlaylistSongsCache] = useState({}) // Cache for playlist songs
  const [isLoading, setIsLoading] = useState(false) // Loading state for UX
  const moreButtonRef = useRef(null)
  const dropdownRef = useRef(null)
  const playlistMenuRef = useRef(null)

  // Fetch playlists when user logs in
  useEffect(() => {
    const fetchPlaylists = async () => {
      const storedUser = localStorage.getItem("user")
      if (!storedUser) {
        setPlaylists([])
        return
      }
      try {
        const userData = JSON.parse(storedUser)
        const response = await fetch(`/api/users/${userData.user_id}/playlists/`)
        if (!response.ok) throw new Error(`Failed to fetch playlists: ${response.status}`)
        const data = await response.json()
        setPlaylists(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching playlists:", error)
        setPlaylists([])
      }
    }
    fetchPlaylists()
  }, [])

  // Handle playlist changes
  useEffect(() => {
    const handlePlaylistChange = () => {
      const storedPlaylists = JSON.parse(localStorage.getItem("playlists") || "[]")
      setPlaylists(storedPlaylists)
    }
    window.addEventListener("playlistsChanged", handlePlaylistChange)
    return () => window.removeEventListener("playlistsChanged", handlePlaylistChange)
  }, [])

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target)
      const isOutsidePlaylistMenu = playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)
      const isNotMoreButton = moreButtonRef.current && !moreButtonRef.current.contains(event.target)

      if (isOutsideDropdown && isOutsidePlaylistMenu && isNotMoreButton) {
        setDropdownOpen(false)
        setPlaylistMenuOpen(false)
      }
    }

    const handleScrollOrResize = () => {
      setDropdownOpen(false)
      setPlaylistMenuOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false)
        setPlaylistMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("scroll", handleScrollOrResize)
    window.addEventListener("resize", handleScrollOrResize)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("scroll", handleScrollOrResize)
      window.removeEventListener("resize", handleScrollOrResize)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const toggleDropdown = useCallback(
    (event) => {
      event.stopPropagation()
      if (dropdownOpen) {
        setDropdownOpen(false)
        setPlaylistMenuOpen(false)
        return
      }

      const buttonRect = event.currentTarget.getBoundingClientRect()
      setDropdownPosition({
        top: buttonRect.bottom,
        left: buttonRect.left,
      })

      setDropdownOpen(true)
      setPlaylistMenuOpen(false)
    },
    [dropdownOpen],
  )

  const togglePlaylistMenu = useCallback((event) => {
    event.stopPropagation()
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      setShowLoginModal(true)
      return
    }
    const menuItemRect = event.currentTarget.getBoundingClientRect()
    setPlaylistMenuPosition({
      top: menuItemRect.top,
      left: menuItemRect.right,
    })
    setPlaylistMenuOpen((prev) => !prev)
  }, [])

  const handleAddToQueue = useCallback(
    (song, event) => {
      event.stopPropagation()
      if (!song?.song_id) {
        console.error("Invalid song data:", song)
        return
      }
      addToQueue(song, event)
      setDropdownOpen(false)
    },
    [addToQueue],
  )

  const handlePlayNext = useCallback(
    (song, event) => {
      event.stopPropagation()
      if (!song?.song_id) {
        console.error("Invalid song data:", song)
        return
      }
      playNext(song, event)
      setDropdownOpen(false)
    },
    [playNext],
  )

  const handleRemoveFromQueue = useCallback(
    (song, event) => {
      event.stopPropagation()
      if (!song?.song_id && !song?.id) {
        console.error("Song ID is missing:", song)
        return
      }
      removeSongFromQueue(song.song_id || song.id, event)
      setDropdownOpen(false)
    },
    [removeSongFromQueue],
  )

  // Check if a song is already in a playlist
  const checkSongInPlaylist = async (userId, playlistNumber, songId) => {
    try {
      // Check cache first
      if (playlistSongsCache[playlistNumber]) {
        return playlistSongsCache[playlistNumber].includes(songId)
      }

      // Fetch songs if not cached
      const response = await fetch(`/api/users/${userId}/playlists/${playlistNumber}/songs/`)
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist songs: ${response.status}`)
      }
      const songs = await response.json()
      const songIds = songs.map((s) => s.song_id)
      
      // Update cache
      setPlaylistSongsCache((prev) => ({
        ...prev,
        [playlistNumber]: songIds,
      }))
      
      return songIds.includes(songId)
    } catch (error) {
      console.error("Error checking song in playlist:", error)
      return false // Assume not in playlist on error to avoid blocking
    }
  }

  const handleAddToPlaylist = useCallback(
    async (song, playlistId, event) => {
      event.stopPropagation()
      const storedUser = localStorage.getItem("user")
      if (!storedUser) {
        setShowLoginModal(true)
        return
      }

      setIsLoading(true)
      try {
        const userData = JSON.parse(storedUser)
        const userId = userData.user_id

        // Find the playlist by ID
        const selectedPlaylist = playlists.find((p) => p.user_playlist_id === playlistId)
        if (!selectedPlaylist) {
          console.error("Playlist not found:", playlistId)
          alert("Playlist không tồn tại!")
          return
        }

        // Check if the song is already in the playlist
        const isSongInPlaylist = await checkSongInPlaylist(userId, selectedPlaylist.playlist_number, song.song_id || song.id)
        if (isSongInPlaylist) {
          alert(`Bài hát "${song.title}" đã có trong playlist "${selectedPlaylist.playlist_name}"!`)
          return
        }

        // Make API call to add song to playlist
        const response = await fetch(`/api/users/${userId}/playlists/${selectedPlaylist.playlist_number}/songs/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            song_id: song.song_id || song.id,
          }),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || `HTTP error ${response.status}`)
        }

        const data = await response.json()
        console.log("Song added to playlist:", data)

        // Update cache
        setPlaylistSongsCache((prev) => ({
          ...prev,
          [selectedPlaylist.playlist_number]: [...(prev[selectedPlaylist.playlist_number] || []), song.song_id || song.id],
        }))

        alert(`Đã thêm "${song.title}" vào playlist "${selectedPlaylist.playlist_name}"`)

        // Dispatch event to notify PlaylistDetail component
        const formattedSong = {
          song_id: song.song_id || song.id,
          title: song.title || "Unknown Title",
          artist: song.artist_name || song.artist || "Unknown Artist",
          duration:
            typeof song.duration === "number"
              ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, "0")}`
              : song.duration || "0:00",
          album: song.album_title || song.album || "",
          image: song.image_url || song.image || "/placeholder.svg?height=60&width=60",
        }

        window.dispatchEvent(
          new CustomEvent("songAddedToPlaylist", {
            detail: {
              playlistId: selectedPlaylist.playlist_number,
              song: formattedSong,
            },
          }),
        )

        // Call the original addToPlaylist function if it exists
        if (typeof addToPlaylist === "function") {
          addToPlaylist(song, playlistId, event)
        }
      } catch (error) {
        console.error("Error adding song to playlist:", error)
        alert(`Không thể thêm bài hát vào playlist: ${error.message}`)
      } finally {
        setIsLoading(false)
      }

      setPlaylistMenuOpen(false)
      setDropdownOpen(false)
    },
    [addToPlaylist, playlists, playlistSongsCache],
  )

  const handleCreateNewPlaylist = useCallback(
    (song, event) => {
      event.stopPropagation()
      const storedUser = localStorage.getItem("user")
      if (!storedUser) {
        setShowLoginModal(true)
        return
      }
      setIsLoading(true)
      try {
        const userData = JSON.parse(storedUser)
        createNewPlaylist(song, event).then((newPlaylist) => {
          // Update playlists in localStorage
          const updatedPlaylists = [...playlists, newPlaylist]
          localStorage.setItem("playlists", JSON.stringify(updatedPlaylists))
          setPlaylists(updatedPlaylists)
          // Update cache with empty song list for new playlist
          setPlaylistSongsCache((prev) => ({
            ...prev,
            [newPlaylist.playlist_number]: [song.song_id || song.id],
          }))
          // Dispatch event to notify Sidebar
          window.dispatchEvent(new Event("playlistsChanged"))
        })
      } catch (error) {
        console.error("Error creating playlist:", error)
        alert(`Không thể tạo playlist: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
      setPlaylistMenuOpen(false)
      setDropdownOpen(false)
    },
    [createNewPlaylist, playlists],
  )

  const handleToggleLike = useCallback(
    (songId, event) => {
      toggleLike(songId, event)
    },
    [toggleLike],
  )

  const handleLoginRedirect = () => {
    window.location.href = "/login"
    setShowLoginModal(false)
  }

  return (
    <div className="song-actions">
      <button
        className={`like-button ${isLiked ? "liked" : ""}`}
        onClick={(e) => handleToggleLike(song.song_id || song.id, e)}
        aria-label={isLiked ? "Unlike" : "Like"}
      >
        <Heart
          size={16}
          fill={isLiked ? "var(--accent-pink, #ff74a4)" : "none"}
          stroke={isLiked ? "var(--accent-pink, #ff74a4)" : "currentColor"}
        />
      </button>

      <div className="dropdown-container">
        <button
          className="more-button"
          onClick={toggleDropdown}
          aria-label="More options"
          ref={moreButtonRef}
          disabled={isLoading}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <DropdownMenu
        isOpen={dropdownOpen}
        onClose={() => setDropdownOpen(false)}
        position={dropdownPosition}
        song={song}
        handleAddToQueue={handleAddToQueue}
        handlePlayNext={handlePlayNext}
        togglePlaylistMenu={togglePlaylistMenu}
        showPlaylistMenu={playlistMenuOpen}
        isInQueue={isInQueue}
        handleRemoveFromQueue={handleRemoveFromQueue}
        ref={dropdownRef}
      />

      <PlaylistSubmenu
        isOpen={playlistMenuOpen && dropdownOpen}
        onClose={() => setPlaylistMenuOpen(false)}
        position={playlistMenuPosition}
        song={song}
        playlists={playlists}
        addToPlaylist={handleAddToPlaylist}
        createNewPlaylist={handleCreateNewPlaylist}
        ref={playlistMenuRef}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginRedirect={handleLoginRedirect}
      />
    </div>
  )
}

export default SongActions