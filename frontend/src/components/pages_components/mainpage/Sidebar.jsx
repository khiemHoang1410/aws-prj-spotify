"use client";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Compass, Disc, Users, Calendar, Clock, Heart, Menu, MessageSquare, MoreHorizontal } from "lucide-react";
import LoginModal from "../ui/LoginModal";
import ChatSidebar from "./ChatSidebar";

function PlaylistDropdown({ isOpen, onClose, position, playlist, onRename, onDelete }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const adjustedPosition = { ...position };

      if (position.left + dropdownRect.width > window.innerWidth) {
        adjustedPosition.left = Math.max(10, window.innerWidth - dropdownRect.width - 10);
      }
      if (position.top + dropdownRect.height > window.innerHeight + window.scrollY) {
        adjustedPosition.top = position.top - dropdownRect.height;
        if (adjustedPosition.top < window.scrollY) {
          adjustedPosition.top = window.scrollY + 10;
        }
      }

      dropdownRef.current.style.top = `${adjustedPosition.top}px`;
      dropdownRef.current.style.left = `${adjustedPosition.left}px`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  return (
    <div
      className="dropdown-menu"
      ref={dropdownRef}
      style={{
        position: "fixed",
        zIndex: 1000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="dropdown-item"
        onClick={(e) => {
          e.stopPropagation();
          onRename(playlist);
          onClose();
        }}
      >
        <span>Đổi tên</span>
      </button>
      <button
        className="dropdown-item"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(playlist);
          onClose();
        }}
      >
        <span>Xóa</span>
      </button>
    </div>
  );
}

function Sidebar({ onClearSearch }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [user, setUser] = useState(null);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [hoveredPlaylist, setHoveredPlaylist] = useState(null);
  const [dropdownState, setDropdownState] = useState({ isOpen: false, position: { top: 0, left: 0 }, playlist: null });
  const [renameModal, setRenameModal] = useState({ isOpen: false, playlist: null });
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // Thêm state cho số tin nhắn chưa đọc

  const navigate = useNavigate();
  const location = useLocation();

  // Hàm lấy danh sách playlist
  const fetchPlaylists = async (userId, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Fetching playlists for user_id: ${userId}, attempt ${i + 1}`);
        const response = await fetch(`http://localhost:8000/api/users/${userId}/playlists/`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Playlists response:", data);
        if (!Array.isArray(data)) {
          console.warn("Expected array for playlists, got:", data);
          setPlaylists([]);
          return;
        }
        const validPlaylists = data.filter(
          (p) =>
            p && p.user_playlist_id && p.playlist_name && Number.isInteger(p.playlist_number) && p.playlist_number > 0,
        );
        setPlaylists(validPlaylists);
        return;
      } catch (error) {
        console.error(`Error fetching playlists (attempt ${i + 1}):`, error.message);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        setPlaylists([]);
      }
    }
  };

  // Hàm lấy số lượng tin nhắn chưa đọc
  const fetchUnreadMessagesCount = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/messages/?user_id=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const messages = await response.json();
      // Đếm số tin nhắn chưa đọc mà người dùng là người nhận
      const unreadCount = messages.filter(
        (msg) => msg.receiver_id === userId && !msg.is_read
      ).length;
      setUnreadMessagesCount(unreadCount);
    } catch (error) {
      console.error("Error fetching unread messages count:", error.message);
      setUnreadMessagesCount(0);
    }
  };

  // Effect để tải dữ liệu người dùng và tin nhắn chưa đọc
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log("User data from localStorage:", userData);
        if (!userData.user_id) {
          throw new Error("Invalid user data: user_id missing");
        }
        setUser(userData);
        fetchPlaylists(userData.user_id);
        fetchUnreadMessagesCount(userData.user_id); // Gọi hàm lấy số tin nhắn chưa đọc
      } catch (err) {
        console.error("Invalid user data:", err);
        localStorage.removeItem("user");
        setShowLoginModal(true);
      }
    }

    const handleUserLogin = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("User login detected:", userData);
          if (!userData.user_id) {
            throw new Error("Invalid user data: user_id missing");
          }
          setUser(userData);
          fetchPlaylists(userData.user_id);
          fetchUnreadMessagesCount(userData.user_id); // Cập nhật tin nhắn chưa đọc khi đăng nhập
        } catch (err) {
          console.error("Invalid user data on login:", err);
          localStorage.removeItem("user");
          setShowLoginModal(true);
        }
      }
    };

    window.addEventListener("userLogin", handleUserLogin);
    return () => window.removeEventListener("userLogin", handleUserLogin);
  }, []);

  // Cập nhật số tin nhắn chưa đọc khi mở/đóng ChatSidebar
  useEffect(() => {
    if (user && showChatSidebar) {
      fetchUnreadMessagesCount(user.user_id); // Cập nhật khi mở ChatSidebar
    }
  }, [showChatSidebar, user]);

  const openModal = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPlaylistName("");
  };

  const handleCreatePlaylist = async () => {
    const trimmedName = playlistName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      alert("Tên playlist phải có ít nhất 3 ký tự!");
      return;
    }

    if (!user || !user.user_id) {
      setShowLoginModal(true);
      return;
    }

    const isDuplicate = playlists.some((playlist) => playlist.playlist_name.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      alert("Tên playlist đã tồn tại! Vui lòng chọn tên khác.");
      return;
    }

    const payload = {
      playlist_name: trimmedName,
      is_public: false,
    };

    try {
      const response = await fetch(`http://localhost:8000/api/users/${user.user_id}/playlists/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || Object.values(errData).join(", ") || `HTTP error ${response.status}: ${response.statusText}`,
        );
      }

      const newPlaylist = await response.json();
      if (!newPlaylist || !newPlaylist.user_playlist_id || !newPlaylist.playlist_name || !newPlaylist.playlist_number) {
        throw new Error("Invalid playlist data returned");
      }

      console.log("New playlist created:", newPlaylist);
      setPlaylists((prev) => [...prev, newPlaylist]);
      fetchPlaylists(user.user_id); // Refresh playlists
      closeModal();
      alert(`Playlist "${newPlaylist.playlist_name}" đã được tạo!`);
      navigate(`/main/playlist/${newPlaylist.playlist_number}`);
      if (onClearSearch) onClearSearch();
    } catch (error) {
      console.error("Error creating playlist:", error.message);
      alert(`Không thể tạo playlist: ${error.message}`);
    }
  };

  const handleNavClick = (path, e) => {
    if (!user && (path === "/main/history" || path === "/main/favorite")) {
      e.preventDefault();
      setShowLoginModal(true);
      return;
    }
    if (path.includes("/playlist/")) {
      const playlistNumber = path.split("/").pop();
      if (!Number.isInteger(Number(playlistNumber)) || Number(playlistNumber) <= 0) {
        e.preventDefault();
        alert("Invalid playlist number");
        return;
      }
    }
    if (onClearSearch) onClearSearch();
    navigate(path);
  };

  const handleLoginRedirect = () => {
    navigate("/login");
    setShowLoginModal(false);
  };

  const handleSignupRedirect = () => {
    navigate("/signup");
    setShowLoginModal(false);
  };

  const toggleChatSidebar = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowChatSidebar(!showChatSidebar);
  };

  const handleMoreClick = (playlist, e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownState({
      isOpen: true,
      position: {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      },
      playlist,
    });
  };

  const handleRenamePlaylist = (playlist) => {
    setRenameModal({ isOpen: true, playlist });
    setPlaylistName(playlist.playlist_name);
  };

  const handleDeletePlaylist = async (playlist) => {
    if (!window.confirm(`Bạn có chắc muốn xóa playlist "${playlist.playlist_name}"?`)) return;

    try {
      const response = await fetch(`http://localhost:8000/api/users/${user.user_id}/playlists/${playlist.playlist_number}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      setPlaylists((prev) => prev.filter((p) => p.user_playlist_id !== playlist.user_playlist_id));
      alert(`Playlist "${playlist.playlist_name}" đã được xóa!`);
      if (location.pathname === `/main/playlist/${playlist.playlist_number}`) {
        navigate("/main");
      }
    } catch (error) {
      console.error("Error deleting playlist:", error.message);
      alert(`Không thể xóa playlist: ${error.message}`);
    }
  };

  const handleRenameSubmit = async () => {
    const trimmedName = playlistName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      alert("Tên playlist phải có ít nhất 3 ký tự!");
      return;
    }

    const isDuplicate = playlists.some(
      (p) => p.user_playlist_id !== renameModal.playlist.user_playlist_id && p.playlist_name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      alert("Tên playlist đã tồn tại! Vui lòng chọn tên khác.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/users/${user.user_id}/playlists/${renameModal.playlist.playlist_number}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_name: trimmedName }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || Object.values(errData).join(", ") || `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const updatedPlaylist = await response.json();
      setPlaylists((prev) =>
        prev.map((p) =>
          p.user_playlist_id === renameModal.playlist.user_playlist_id ? updatedPlaylist : p
        )
      );
      alert(`Playlist đã được đổi tên thành "${trimmedName}"!`);
      setRenameModal({ isOpen: false, playlist: null });
      setPlaylistName("");
    } catch (error) {
      console.error("Error renaming playlist:", error.message);
      alert(`Không thể đổi tên playlist: ${error.message}`);
    }
  };

  return (
    <>
      <div className="mobile-menu">
        <button onClick={() => setShowSidebar(!showSidebar)}>
          <Menu size={24} />
        </button>
      </div>

      <aside className={`sidebar ${showSidebar ? "show" : "hide"}`}>
        <div className="sidebar-header">
          <h3>MENU</h3>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={location.pathname === "/main" ? "active" : ""}>
              <Link to="/main" onClick={(e) => handleNavClick("/main", e)}>
                <Compass size={20} />
                <span>Explore</span>
              </Link>
            </li>
            <li className={location.pathname === "/main/albums" ? "active" : ""}>
              <Link to="/main/albums" onClick={(e) => handleNavClick("/main/albums", e)}>
                <Disc size={20} />
                <span>Albums</span>
              </Link>
            </li>
            <li className={location.pathname === "/main/artists" ? "active" : ""}>
              <Link to="/main/artists" onClick={(e) => handleNavClick("/main/artists", e)}>
                <Users size={20} />
                <span>Artists</span>
              </Link>
            </li>
            <li className={location.pathname === "/main/songs" ? "active" : ""}>
              <Link to="/main/songs" onClick={(e) => handleNavClick("/main/songs", e)}>
                <Calendar size={20} />
                <span>Songs</span>
              </Link>
            </li>
            <li className={showChatSidebar ? "active" : ""}>
              <a onClick={toggleChatSidebar} style={{ cursor: "pointer", position: "relative" }}>
                <MessageSquare size={20} />
                <span>Messages</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-header">
          <h3>MY MUSIC</h3>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={location.pathname === "/main/history" ? "active" : ""}>
              <Link to="/main/history" onClick={(e) => handleNavClick("/main/history", e)}>
                <Clock size={20} />
                <span>Recently Played</span>
              </Link>
            </li>
            <li className={location.pathname === "/main/favorite" ? "active" : ""}>
              <Link to="/main/favorite" onClick={(e) => handleNavClick("/main/favorite", e)}>
                <Heart size={20} />
                <span>Favorite Songs</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-header">
          <h3>PLAYLISTS</h3>
          <button className="add-playlist" onClick={openModal}>
            +
          </button>
        </div>

        <nav className="sidebar-nav">
          {playlists.length === 0 ? (
            <div className="create-playlist-container">
              <h3 className="create-playlist-title">Tạo danh sách phát đầu tiên của bạn</h3>
              <p className="create-playlist-description">Rất dễ! Chúng tôi sẽ giúp bạn</p>
              <button className="create-playlist-button" onClick={openModal}>
                Tạo danh sách phát
              </button>
            </div>
          ) : (
            <ul className="playlists-list">
              {playlists.map((playlist) => (
                <li
                  key={playlist.user_playlist_id}
                  className={location.pathname === `/main/playlist/${playlist.playlist_number}` ? "active" : ""}
                  onMouseEnter={() => setHoveredPlaylist(playlist.user_playlist_id)}
                  onMouseLeave={() => setHoveredPlaylist(null)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Link
                    to={`/main/playlist/${playlist.playlist_number}`}
                    onClick={(e) => handleNavClick(`/main/playlist/${playlist.playlist_number}`, e)}
                    style={{ flex: 1 }}
                  >
                    {playlist.playlist_name || "Unnamed Playlist"}
                  </Link>
                  {hoveredPlaylist === playlist.user_playlist_id && (
                    <button className="more-button" onClick={(e) => handleMoreClick(playlist, e)}>
                      <MoreHorizontal size={20} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-playlist">
            <button className="modal-close-btn" onClick={closeModal}>
              X
            </button>
            <h2>Tạo playlist mới</h2>
            <input
              type="text"
              maxLength="50"
              placeholder="Nhập tên playlist (tối thiểu 3 ký tự)"
              value={playlistName}
              onChange={(e) => {
                console.log("Input changed:", e.target.value);
                setPlaylistName(e.target.value);
              }}
              className="playlist-input"
            />
            <button className="create-button" onClick={handleCreatePlaylist}>
              Tạo mới
            </button>
          </div>
        </div>
      )}

      {renameModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content-playlist">
            <button
              className="modal-close-btn"
              onClick={() => {
                setRenameModal({ isOpen: false, playlist: null });
                setPlaylistName("");
              }}
            >
              X
            </button>
            <h2>Đổi tên playlist</h2>
            <input
              type="text"
              maxLength="50"
              placeholder="Nhập tên playlist mới (tối thiểu 3 ký tự)"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="playlist-input"
            />
            <button className="create-button" onClick={handleRenameSubmit}>
              Lưu
            </button>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginRedirect={handleLoginRedirect}
        onSignupRedirect={handleSignupRedirect}
      />

      <ChatSidebar isOpen={showChatSidebar} onClose={() => setShowChatSidebar(false)} currentUser={user} />

      <PlaylistDropdown
        isOpen={dropdownState.isOpen}
        onClose={() => setDropdownState({ isOpen: false, position: { top: 0, left: 0 }, playlist: null })}
        position={dropdownState.position}
        playlist={dropdownState.playlist}
        onRename={handleRenamePlaylist}
        onDelete={handleDeletePlaylist}
      />
    </>
  );
}

export default Sidebar;