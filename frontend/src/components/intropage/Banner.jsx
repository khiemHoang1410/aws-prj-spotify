import { useState, useEffect } from "react";
import { IntroMockData } from "../../services/IntroMockData";

function Banner() {
  const [albumImages, setAlbumImages] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    // Không cần loading nữa vì data ở local
    setAlbumImages(IntroMockData.bannerAlbums);
  }, []);

  return (
    <div className="container banner">
      <div className={`slider ${hoveredIndex !== null ? "paused" : ""}`} style={{ "--quantity": albumImages.length }}>
        {albumImages.map((src, index) => (
          <div 
            className={`item ${hoveredIndex === index ? "centered" : ""}`} 
            key={index} 
            style={{ "--position": index + 1 }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="card-container">
              <img src={src} alt={`Album ${index + 1}`} />
              <div className="card-container">
                <img src={src} alt={`Album ${index + 1}`} className="original-image" />
                <img src={src} alt={`Secondary Album ${index + 1}`} className="secondary-image" />
                <div className="glowing-elements">
                  <div className="glow-1"></div>
                  <div className="glow-2"></div>
                  <div className="glow-3"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="content">
        <h1 data-content="ALBUM">ALBUM</h1>
        <div className="author">
          <h2>Top Albums of the Year</h2>
          <p><b>Exploration</b></p>
          <p>Lists of top music</p>
        </div>
        <div className="model"></div>
      </div>
    </div>
  );
}
export default Banner;