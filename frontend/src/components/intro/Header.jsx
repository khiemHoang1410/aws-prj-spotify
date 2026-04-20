import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi"; 
import { IntroMockData } from "../../data/IntroMockData"; // Đã import mock data

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleScroll = (e, sectionId) => {
    e.preventDefault(); 
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth" });
    setActiveSection(sectionId);
    setIsMenuOpen(false); 
  };

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "stats", label: "About us" },
    { id: "trending", label: "Trending" },
    { id: "top-artists", label: "Top" },
    { id: "subscribe", label: "Contact Us" },
  ];

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
            {navLinks.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`nav-link${activeSection === id ? " active" : ""}`}
                  onClick={(e) => handleScroll(e, id)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
export default Header;
