"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Play } from "lucide-react"

function AllArtists() {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch("/api/artists/")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        const formattedArtists = data.map((artist) => ({
          artist_id: artist.artist_id,
          artist_name: artist.artist_name || "Unknown Artist",
          image_url: artist.image_url || "/placeholder.svg?height=180&width=180",
          nationality: artist.nationality || "Unknown",
        }))
        setArtists(formattedArtists)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching artists:", error)
        setError(error.message)
        setLoading(false)
      })
  }, [])

  const handleClick = (artistId) => {
    navigate(`/main/artist/${artistId}`)
  }

  const vietnameseArtists = artists.filter(
    (artist) => artist.nationality === "Vietnam" || artist.nationality === "Việt Nam"
  )
  const internationalArtists = artists.filter(
    (artist) => artist.nationality !== "Vietnam" && artist.nationality !== "Việt Nam"
  )

  if (loading) return <div className="all-artists-loading">Đang tải...</div>
  if (error) return <div className="all-artists-error">Lỗi: {error}</div>

  return (
    <section className="all-artists">
      <div className="section-header">
        <h2 className="section-title">Nghệ sĩ Việt Nam</h2>
      </div>
      <div className="artists-grid">
        {vietnameseArtists.length > 0 ? (
          vietnameseArtists.map((artist) => (
            <div
              key={artist.artist_id}
              className="artist-card"
              onClick={() => handleClick(artist.artist_id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && handleClick(artist.artist_id)}
            >
              <div className="artist-cover">
                <img src={artist.image_url} alt={artist.artist_name} />
                <div className="artist-overlay">
                  <button
                    className="play-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClick(artist.artist_id)
                    }}
                    aria-label={`Xem ${artist.artist_name}`}
                  >
                    <Play size={24} fill="white" />
                  </button>
                </div>
              </div>
              <div className="artist-info">
                <h3 className="artist-name">{artist.artist_name}</h3>
                <p className="artist-label">Nghệ sĩ</p>
              </div>
            </div>
          ))
        ) : (
          <p>Không có nghệ sĩ Việt Nam nào.</p>
        )}
      </div>

      <div className="section-header">
        <h2 className="section-title">Nghệ sĩ quốc tế</h2>
      </div>
      <div className="artists-grid">
        {internationalArtists.length > 0 ? (
          internationalArtists.map((artist) => (
            <div
              key={artist.artist_id}
              className="artist-card"
              onClick={() => handleClick(artist.artist_id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && handleClick(artist.artist_id)}
            >
              <div className="artist-cover">
                <img src={artist.image_url} alt={artist.artist_name} />
                <div className="artist-overlay">
                  <button
                    className="play-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClick(artist.artist_id)
                    }}
                    aria-label={`Xem ${artist.artist_name}`}
                  >
                    <Play size={24} fill="black" />
                  </button>
                </div>
              </div>
              <div className="artist-info">
                <h3 className="artist-name">{artist.artist_name}</h3>
                <p className="artist-label">Nghệ sĩ</p>
              </div>
            </div>
          ))
        ) : (
          <p>Không có nghệ sĩ quốc tế nào.</p>
        )}
      </div>
    </section>
  )
}

export default AllArtists