"use client";
import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const text = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(text);
          } catch {
            errorData = { error: `HTTP error! status: ${response.status}`, details: text || "No response body" };
          }
          throw new Error(`${errorData.error}: ${errorData.details || "No details"}`);
        }
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(`Retry ${i + 1}/${retries} for ${url}: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const data = await fetchWithRetry("/api/artists/", {
          headers: { "Content-Type": "application/json" },
        });
        const formattedArtists = Array.isArray(data) ? data.map(artist => ({
          artist_id: artist.artist_id,
          artist_name: artist.artist_name || "Unknown Artist",
          image_url: artist.image_url || "/placeholder.svg?height=180&width=180",
        })) : [];
        setArtists(formattedArtists);
      } catch (error) {
        console.error("Error fetching artists:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const handleClick = artistId => {
    navigate(`/main/artist/${artistId}`);
  };

  if (loading) return <div className="artists-loading">Đang tải...</div>;
  if (error) return <div className="artists-error">Lỗi: {error}</div>;

  const displayedArtists = artists.slice(0, 7);

  if (!displayedArtists.length) {
    return (
      <section className="artists-section">
        <div className="section-header">
          <h2 className="section-title">Nghệ sĩ phổ biến</h2>
          <a href="/main/artists" className="see-all">
            Xem tất cả
          </a>
        </div>
        <p>Không có nghệ sĩ nào.</p>
      </section>
    );
  }

  return (
    <section className="artists-section">
      <div className="section-header">
        <h2 className="section-title">Nghệ sĩ phổ biến</h2>
        <a href="/main/artists" className="see-all">
          Xem tất cả
        </a>
      </div>
      <div className="artists-grid">
        {displayedArtists.map(artist => (
          <div
            key={artist.artist_id}
            className="artist-card"
            onClick={() => handleClick(artist.artist_id)}
            role="button"
            tabIndex={0}
            onKeyPress={e => e.key === "Enter" && handleClick(artist.artist_id)}
          >
            <div className="artist-cover">
              <img src={artist.image_url} alt={artist.artist_name} loading="lazy" />
              <div className="artist-overlay">
                <button
                  className="play-button"
                  onClick={e => {
                    e.stopPropagation();
                    handleClick(artist.artist_id);
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
        ))}
      </div>
    </section>
  );
}

export default Artists;