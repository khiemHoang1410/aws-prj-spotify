"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Play } from "lucide-react"

function AllAlbums() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("/api/albums/", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const formattedAlbums = Array.isArray(data)
          ? data.map((album) => ({
              album_id: album.album_id,
              album_name: album.album_name || "Unknown Album",
              artist_name: album.artist_name || "Unknown Artist",
              cover_url: album.cover_url || "/placeholder.svg?height=160&width=160",
              release_date: album.release_date ? new Date(album.release_date).getFullYear() : "Unknown",
              songs_count: album.total_songs || 0, // Sử dụng total_songs từ backend
            }))
          : []
        setAlbums(formattedAlbums)
      } catch (error) {
        console.error("Error fetching albums:", error)
        setError(error.message || "Không thể tải danh sách album")
      } finally {
        setLoading(false)
      }
    }

    fetchAlbums()
  }, [])

  const handleClick = (albumId) => {
    navigate(`/main/album/${albumId}`)
  }

  if (loading) {
    return <div className="all-albums-loading">Đang tải...</div>
  }

  if (error) {
    return <div className="all-albums-error">Lỗi: {error}</div>
  }

  return (
    <section className="all-albums">
      <div className="section-header">
        <h2 className="section-title">Album phổ biến</h2>
      </div>
      <div className="albums-grid">
        {albums.length === 0 ? (
          <p>Không có album nào.</p>
        ) : (
          albums.map((album) => (
            <div
              key={album.album_id}
              className="album-card"
              onClick={() => handleClick(album.album_id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && handleClick(album.album_id)}
            >
              <div className="album-cover">
                <img
                  src={album.cover_url}
                  alt={album.album_name}
                  loading="lazy"
                  onError={(e) => (e.target.src = "/placeholder.svg?height=160&width=160")}
                />
                <div className="album-overlay">
                  <button
                    className="play-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClick(album.album_id)
                    }}
                    aria-label={`Xem ${album.album_name}`}
                  >
                    <Play size={24} fill="black" />
                  </button>
                </div>
              </div>
              <div className="album-info">
                <h3 className="album-title">{album.album_name}</h3>
                <p className="album-artist">{album.artist_name}</p>
                {/* <p className="album-meta">{album.release_date} • {album.songs_count} bài hát</p> */}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default AllAlbums