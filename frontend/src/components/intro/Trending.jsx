import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IntroMockData } from "../../data/IntroMockData";

function Trending() {
  const [trendingImages, setTrendingImages] = useState([]);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/');
  };

  useEffect(() => {
    setTrendingImages(IntroMockData.trending);
  }, []);

  return (
    <section className="trending-section container">
      <div className="trending-grid">
        <div className="nft-grid">
          {trendingImages.map((nft) => (
            <div key={nft.id} className="nft-item">
              <img src={nft.image || "/placeholder.svg"} alt={nft.alt} />
            </div>
          ))}
        </div>
        <div className="trending-content">
          <span className="trending-label">Popular Item</span>
          <h2 className="trending-title">Hot Trending On This Week.</h2>
          <p className="trending-description">
            This song has taken the music charts by storm, quickly climbing to 
            the top of Spotify's trending list. With its catchy melody and heartfelt 
            lyrics, it resonates with listeners of all ages.
          </p>
          <button className="learn-more" onClick={handleGetStarted}>
            <span className="circle" aria-hidden="true">
              <span className="icon arrow"></span>
            </span>
            <span className="button-text">See all</span>
          </button>
        </div>
      </div>
    </section>
  );
}
export default Trending;
