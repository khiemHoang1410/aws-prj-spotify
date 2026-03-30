import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi"; 
import { IntroMockData } from "../../data/IntroMockData"; // Đã import mock data

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleScroll = (e, sectionId) => {
    e.preventDefault(); 
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false); 
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <a href="#home" onClick={(e) => handleScroll(e, "home")}>
            {/* Lấy logo từ Mock Data, chỉnh width nhỏ lại cho vừa mắt */}
            <img
              src={IntroMockData.logo}
              alt="Logo"
              className="logo-image"
              style={{ width: "130px", objectFit: "contain" }} 
              onError={(e) => { e.target.src = "https://via.placeholder.com/150x50?text=Logo"; }}
            />
          </a>
        </div>
        <button className="mobile-menu-button" onClick={toggleMenu}>
          {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <nav className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          <ul>
            <li><a href="#home" className="nav-link active" onClick={(e) => handleScroll(e, "home")}>Home</a></li>
            <li><a href="#stats" className="nav-link" onClick={(e) => handleScroll(e, "stats")}>About us</a></li>
            <li><a href="#trending" className="nav-link" onClick={(e) => handleScroll(e, "trending")}>Trending</a></li>
            <li><a href="#top-artists" className="nav-link" onClick={(e) => handleScroll(e, "top-artists")}>Top</a></li>
            <li><a href="#contact" className="nav-link" onClick={(e) => handleScroll(e, "contact")}>Contact Us</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
export default Header;
