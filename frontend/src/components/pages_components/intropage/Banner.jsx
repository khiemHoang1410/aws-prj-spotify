import { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:8000";

function Banner() {
  const [albumImages, setAlbumImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const images = Array.from({ length: 10 }, (_, i) => 
          `${BACKEND_URL}/static/images/intropage/album_${i + 1}.jpg`
        );
        console.log("Image URLs:", images);
        setAlbumImages(images);
        setLoading(false);
      } catch (error) {
        console.error("Error setting images:", error);
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container banner">
      <div 
        className={`slider ${hoveredIndex !== null ? "paused" : ""}`} 
        style={{ "--quantity": albumImages.length }}
      >
        {albumImages.map((src, index) => (
          <div 
            className={`item ${hoveredIndex === index ? "centered" : ""}`} 
            key={index} 
            style={{ "--position": index + 1 }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="card-container">
              <img
                src={src}
                alt={`Album ${index + 1}`}
              />
              <div className="card-container">
                <img
                  src={src}
                  alt={`Album ${index + 1}`}
                  className="original-image"
                />
                <img
                  src={`${BACKEND_URL}/static/images/intropage/secondary_album_${index + 1}.jpg`} 
                  alt={`Secondary Album ${index + 1}`}
                  className="secondary-image"
                />
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