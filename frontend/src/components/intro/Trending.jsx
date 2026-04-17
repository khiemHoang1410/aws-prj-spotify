import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTrendingSongs } from "../../services/SongService";

function Trending() {
  const [trendingImages, setTrendingImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/');
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setIsLoading(true);
        // Fetch top 8 trending songs
        const songs = await getTrendingSongs(8);
        const trendingData = (Array.isArray(songs) ? songs : []).map((song) => ({
          id: song.song_id,
          image: song.image_url,
          alt: song.title,
          title: song.title,
        }));
        setTrendingImages(trendingData);
      } catch (error) {
        console.error('Failed to fetch trending songs:', error);
        setTrendingImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <section className="trending-section container">
      <div className="trending-grid">
        <div className="nft-grid">
          {trendingImages.map((nft) => (
            <div key={nft.id} className="nft-item">
              <img 
                src={nft.image || "/pictures/whiteBackground.jpg"} 
                alt={nft.alt}
                onError={(e) => e.target.src = "/pictures/whiteBackground.jpg"} />
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
