import { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:8000";

function TopArtists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistData = Array.from({ length: 2 }, (_, i) => ({
          id: i + 1,
          name: `Artist ${i + 1}`,
          followers: `Followers ${20 + (i + 1) * 4}`, 
          avatar: `${BACKEND_URL}/static/images/intropage/avatar_${i + 1}.jpg`,
          artwork: `${BACKEND_URL}/static/images/intropage/artwork_${i + 1}.jpg`,
          gradientClass: i % 2 === 0 ? "gradient-pink-purple" : "gradient-purple-indigo",
        }));
        console.log("Artist Data:", artistData);
        setArtists(artistData);
        setLoading(false);
      } catch (error) {
        console.error("Error setting artist data:", error);
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <section className="top-artists-section container">
      <div className="top-artists-header">
        <span className="section-label">Artist</span>
        <h2 className="section-title">
          Top List <br />
          Artist.
        </h2>
        <p className="section-description">
          We have dozens of artists who contribute to create amazing works
        </p>
      </div>

      <div className="top-artists-grid">
        {artists.map((artist) => (
          <div key={artist.id} className="top-artist-card">
            <div className="top-artist-info">
              <div className="top-artist-avatar">
                <img
                  src={artist.avatar || "/placeholder.svg"}
                  alt={artist.name}
                />
              </div>
              <div className="top-artist-details">
                <h3 className="top-artist-name">{artist.name}</h3>
                <p className="top-artist-followers">{artist.followers}</p>
              </div>
            </div>
            <div className={`top-artist-artwork ${artist.gradientClass}`}>
              <img
                src={artist.artwork || "/placeholder.svg"}
                alt={`Artwork by ${artist.name}`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TopArtists;