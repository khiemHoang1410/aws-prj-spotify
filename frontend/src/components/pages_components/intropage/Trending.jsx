import { useState, useEffect } from "react";
import { ArrowRight } from "./Icons";
import { Navigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:8000";

function Trending() {
  const [trendingImages, setTrendingImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleGetStarted = () => {
    navigate("/main"); 
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const images = Array.from({ length: 4 }, (_, i) => ({
          id: i + 1,
          image: `${BACKEND_URL}/static/images/intropage/trending_${i + 1}.jpg`,
          alt: `Trending ${i + 1}`,
        }));
        console.log("Trending Image URLs:", images);
        setTrendingImages(images);
        setLoading(false);
      } catch (error) {
        console.error("Error setting Trending images:", error);
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <section className="trending-section container">
      <div className="trending-grid">
        <div className="nft-grid">
          {trendingImages.map((nft) => (
            <div key={nft.id} className="nft-item">
              <img
                src={nft.image || "/placeholder.svg"}
                alt={nft.alt}
              />
            </div>
          ))}
        </div>
        <div className="trending-content">
          <span className="trending-label">Popular Item</span>
          <h2 className="trending-title">Hot Trending On This Week.</h2>
          <p className="trending-description">
            This song has taken the music charts by storm, quickly climbing to 
            the top of Spotify's trending list. With its catchy melody and heartfelt 
            lyrics, it resonates with listeners of all ages. The artist’s unique style 
            and powerful vocals add depth to the song, making it perfect for any occasion
            – whether you're relaxing at home or hitting the gym. Its infectious rhythm 
            and emotional appeal make it a standout hit, earning countless streams and widespread acclaim.
          </p>
          <button className="learn-more">
            <span className="circle" aria-hidden="true">
              <span className="icon arrow"></span>
            </span>
            <span className="button-text" onClick={handleGetStarted}>See all</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default Trending;