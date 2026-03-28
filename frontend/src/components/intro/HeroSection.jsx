import React from "react";
// 1. IMPORT FILE CSS VÀO ĐÂY
import { useNavigate } from 'react-router-dom';
import '../../styles/PageIntro/HeroSection.css';

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-overlay">
        <div className="hero-image">
          <div className="blur-circle blur-circle-1"></div>
          <div className="blur-circle blur-circle-2"></div>
        </div>
      </div>
      <div className="container hero-content">
        <h1 className="hero-title">Music Web.</h1>
        <p className="hero-description">
          EnDommu is a shared liquidity NFT market smart contract which is used by multiple websites to provide the users
          the best possible experience.
        </p>
        <div className="hero-buttons">
          
          {/* 2. THÊM CLASS btn-get-started VÀO NÚT NÀY */}
          <button className="btn-get-started" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
            <span className="text">Get Started</span>
            <span className="circle"></span>
            <svg viewBox="0 0 24 24" className="arr-1" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
            </svg>
          </button>

          <button className="btn btn-link">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;