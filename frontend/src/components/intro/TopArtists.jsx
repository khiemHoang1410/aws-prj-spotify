import { useState, useEffect } from "react";
import { getArtists } from "../../services/ArtistService";

function TopArtists() {
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setIsLoading(true);
        // Fetch từ service và lấy top 8 artists
        const data = await getArtists();
        const topArtists = (Array.isArray(data) ? data : []).slice(0, 8);
        setArtists(topArtists);
      } catch (error) {
        console.error('Failed to fetch artists:', error);
        setArtists([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, []);

  return (
    <section className="top-artists-section container">
      <div className="top-artists-header">
        <span className="section-label">Artist</span>
        <h2 className="section-title">Top List <br />Artist.</h2>
        <p className="section-description">We have dozens of artists who contribute to create amazing works</p>
      </div>
      <div className="top-artists-grid">
        {isLoading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ccc' }}>Loading artists...</p>
          </div>
        ) : artists.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ccc' }}>No artists found</p>
          </div>
        ) : (
          artists.map((artist) => (
            <div key={artist.id} className="top-artist-card">
              <div className="top-artist-info">
                <div className="top-artist-avatar">
                  <img 
                    src={artist.photo_url || artist.image_url || "/placeholder.svg"} 
                    alt={artist.name} 
                    onError={(e) => e.target.src = "/placeholder.svg"} />
                </div>
                <div className="top-artist-details">
                  <h3 className="top-artist-name">{artist.name}</h3>
                  <p className="top-artist-followers">
                    {artist.followers ? `${(artist.followers / 1000).toFixed(0)}K followers` : 'Artist'}
                  </p>
                </div>
              </div>
              <div className="top-artist-artwork" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <img 
                  src={artist.artist_background || artist.photo_url || "/placeholder.svg"} 
                  alt={`${artist.name} artwork`}
                  onError={(e) => e.target.src = "/placeholder.svg"} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
export default TopArtists;
