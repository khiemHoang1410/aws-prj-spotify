import { useState, useEffect } from "react";
import { IntroMockData } from "../../data/IntroMockData";

function TopArtists() {
  const [artists, setArtists] = useState([]);

  useEffect(() => {
    setArtists(IntroMockData.topArtists);
  }, []);

  return (
    <section className="top-artists-section container">
      <div className="top-artists-header">
        <span className="section-label">Artist</span>
        <h2 className="section-title">Top List <br />Artist.</h2>
        <p className="section-description">We have dozens of artists who contribute to create amazing works</p>
      </div>
      <div className="top-artists-grid">
        {artists.map((artist) => (
          <div key={artist.id} className="top-artist-card">
            <div className="top-artist-info">
              <div className="top-artist-avatar">
                <img src={artist.avatar || "/placeholder.svg"} alt={artist.name} />
              </div>
              <div className="top-artist-details">
                <h3 className="top-artist-name">{artist.name}</h3>
                <p className="top-artist-followers">{artist.followers}</p>
              </div>
            </div>
            <div className={`top-artist-artwork ${artist.gradientClass}`}>
              <img src={artist.artwork || "/placeholder.svg"} alt={`Artwork by ${artist.name}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export default TopArtists;