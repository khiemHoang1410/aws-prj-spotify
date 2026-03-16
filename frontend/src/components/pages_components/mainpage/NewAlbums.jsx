"use client";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

function NewAlbums({ onAlbumClick }) {
  const [albums, setAlbums] = useState([]);
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
    const fetchNewAlbums = async () => {
      try {
        const data = await fetchWithRetry("/api/albums/", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const formattedAlbums = Array.isArray(data)
          ? data
              .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
              .slice(0, 6)
              .map(album => ({
                album_id: album.album_id,
                album_name: album.album_name || "Unknown Album",
                artist_name: album.artist_name || "Unknown Artist",
                cover_url: album.cover_url || "/placeholder.svg?height=160&width=160",
                release_date: album.release_date ? new Date(album.release_date).getFullYear() : "Unknown",
              }))
          : [];
        setAlbums(formattedAlbums);
      } catch (error) {
        console.error("Error fetching new albums:", error);
        setError(error.message || "Không thể tải danh sách album mới");
      } finally {
        setLoading(false);
      }
    };

    fetchNewAlbums();
  }, []);

  const handleClick = albumId => {
    if (onAlbumClick) {
      onAlbumClick({ id: albumId });
    }
    navigate(`/main/album/${albumId}`);
  };

  if (loading) {
    return <div className="new-albums-loading">Đang tải...</div>;
  }

  if (error) {
    return <div className="new-albums-error">Lỗi: {error}</div>;
  }

  if (!albums.length) {
    return (
      <section className="new-albums">
        <div className="section-header">
          <h2 className="section-title">Album mới</h2>
          <a href="#" className="see-all">
            Xem tất cả
          </a>
        </div>
        <p>Không có album mới nào.</p>
      </section>
    );
  }

  return (
    <section className="new-albums">
      <div className="section-header">
        <h2 className="section-title">Album mới</h2>
        <a href="#" className="see-all">
          Xem tất cả
        </a>
      </div>
      <div className="albums-grid">
        {albums.map(album => (
          <div
            key={album.album_id}
            className="album-card"
            onClick={() => handleClick(album.album_id)}
            role="button"
            tabIndex={0}
            onKeyPress={e => e.key === "Enter" && handleClick(album.album_id)}
          >
            <div className="album-cover">
              <img
                src={album.cover_url}
                alt={album.album_name}
                loading="lazy"
                onError={e => (e.target.src = "/placeholder.svg?height=160&width=160")}
              />
              <div className="album-overlay">
                <button
                  className="play-button"
                  onClick={e => {
                    e.stopPropagation();
                    handleClick(album.album_id);
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
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

NewAlbums.propTypes = {
  onAlbumClick: PropTypes.func,
};

export default NewAlbums;