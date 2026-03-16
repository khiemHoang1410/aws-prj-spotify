"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Bell, Home, Settings, LogOut, Edit, X, Eye, EyeOff, Camera } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { debounce } from "lodash"

function Header({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [user, setUser] = useState(null)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [suggestions, setSuggestions] = useState([]) // Danh sách gợi ý nghệ sĩ
  const searchInputRef = useRef(null)
  const settingsDropdownRef = useRef(null)
  const navigate = useNavigate()

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  })
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")
  const [passwordStrength, setPasswordStrength] = useState("")
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false)
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false)
  const profileModalRef = useRef(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (err) {
        console.error("Invalid user data:", err)
        localStorage.removeItem("user")
      }
    }

    const handleUserLogin = () => {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    }
    window.addEventListener("userLogin", handleUserLogin)
    return () => window.removeEventListener("userLogin", handleUserLogin)
  }, [])

  useEffect(() => {
    if (user?.user_id) {
      const fetchUnreadMessages = async () => {
        try {
          const response = await fetch(`/api/messages/?user_id=${user.user_id}`)
          if (!response.ok) throw new Error("Failed to fetch messages")
          const messages = await response.json()
          const unreadCount = messages.filter((msg) => msg.receiver_id === user.user_id && !msg.is_read).length
          setUnreadMessages(unreadCount)
        } catch (error) {
          console.error("Error fetching unread messages:", error)
          setUnreadMessages(0)
        }
      }
      fetchUnreadMessages()
      const intervalId = setInterval(fetchUnreadMessages, 30000)
      return () => clearInterval(intervalId)
    }
  }, [user])

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setShowSettingsDropdown(false)
      }
      if (profileModalRef.current && !profileModalRef.current.contains(event.target)) {
        setShowProfileModal(false)
        setIsEditing(false)
        setProfileError("")
        setProfileSuccess("")
        setCurrentPasswordVerified(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
      })
    }
  }, [user])

  const fetchSuggestions = debounce(async (query) => {
    if (query && query.trim().length >= 1) {
      try {
        const response = await fetch(`/api/suggest/artists/?query=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.artists.slice(0, 5)) // Lấy tối đa 5 gợi ý
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setSuggestions([])
      }
    } else {
      setSuggestions([])
    }
  }, 200)

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    fetchSuggestions(value)
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    setSuggestions([]) // Ẩn gợi ý khi submit
    try {
      if (searchQuery.trim()) {
        const response = await fetch(`/api/search/?query=${encodeURIComponent(searchQuery)}`)
        if (!response.ok) throw new Error("Search request failed")
        const data = await response.json()
        onSearch(searchQuery, data)
        navigate("/main")
      } else {
        onSearch("", { songs: [], albums: [], artists: [] })
      }
    } catch (error) {
      console.error("Error fetching search results:", error)
      onSearch(searchQuery, { songs: [], albums: [], artists: [] })
    }
  }

  const handleSuggestionClick = (artistName) => {
    setSearchQuery(artistName)
    setSuggestions([])
    handleSearchSubmit(new Event("submit"))
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSuggestions([])
    onSearch("", { songs: [], albums: [], artists: [] })
    if (searchInputRef.current) {
      searchInputRef.current.querySelector("input").focus()
    }
  }

  const handleHomeClick = () => {
    navigate("/main")
    clearSearch()
  }

  const handleLoginClick = () => {
    navigate("/login")
  }

  const handleRegisterClick = () => {
    navigate("/signup")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    setUser(null)
    setUnreadMessages(0)
    navigate("/intro")
  }

  const toggleSettingsDropdown = () => {
    setShowSettingsDropdown(!showSettingsDropdown)
  }

  const handleAvatarClick = () => {
    setShowProfileModal(true)
    setIsEditing(false)
    setProfileError("")
    setProfileSuccess("")
    setCurrentPasswordVerified(false)
  }

  const checkPasswordStrength = (pwd) => {
    if (!pwd) return ""
    const minLength = pwd.length >= 8
    const hasUpperCase = /[A-Z]/.test(pwd)
    const hasLowerCase = /[a-z]/.test(pwd)
    const hasNumber = /\d/.test(pwd)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    const score = [minLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length
    if (score === 5) return "strong"
    else if (score >= 3) return "medium"
    else if (pwd.length > 0) return "weak"
    return ""
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value))
    }
  }

  const verifyCurrentPassword = async () => {
    setProfileError("")
    setProfileSuccess("")
    setIsVerifyingPassword(true)
    if (!profileData.currentPassword) {
      setProfileError("Current password is required")
      setIsVerifyingPassword(false)
      return
    }
    try {
      const response = await fetch(`/api/verify-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, password: profileData.currentPassword }),
      })
      const data = await response.json()
      if (response.ok && data.verified) {
        setCurrentPasswordVerified(true)
        setProfileSuccess("Password verified successfully")
      } else {
        setProfileError(data.message || "Current password is incorrect")
        setCurrentPasswordVerified(false)
      }
    } catch (error) {
      console.error("Error verifying password:", error)
      setProfileError("Failed to verify password. Please try again.")
      setCurrentPasswordVerified(false)
    } finally {
      setIsVerifyingPassword(false)
    }
  }

  const handleEditProfile = () => {
    setIsEditing(true)
    setProfileError("")
    setProfileSuccess("")
    setCurrentPasswordVerified(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setProfileData({
      username: user?.username || "",
      email: user?.email || "",
      currentPassword: "",
      password: "",
      confirmPassword: "",
    })
    setProfileError("")
    setProfileSuccess("")
    setCurrentPasswordVerified(false)
    setPasswordStrength("")
  }

  const handleSaveProfile = async () => {
    setProfileError("")
    setProfileSuccess("")
    if (!profileData.username.trim()) {
      setProfileError("Username is required")
      return
    }
    if (!profileData.email.trim()) {
      setProfileError("Email is required")
      return
    }
    if (profileData.password || profileData.confirmPassword) {
      if (!currentPasswordVerified) {
        setProfileError("Please verify your current password first")
        return
      }
      if (passwordStrength === "weak") {
        setProfileError(
          "Password is too weak. It must include at least 3 of the following: 8+ characters, uppercase letters, lowercase letters, numbers, and special characters."
        )
        return
      }
      if (profileData.password !== profileData.confirmPassword) {
        setProfileError("Passwords do not match")
        return
      }
    }
    try {
      const updateData = { username: profileData.username, email: profileData.email }
      if (profileData.password && currentPasswordVerified) updateData.password = profileData.password
      const response = await fetch(`/api/users/${user.user_id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || Object.values(errorData).flat().join(", ") || "Failed to update profile")
      }
      const updatedUser = await response.json()
      const newUserData = {
        ...user,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar_url: updatedUser.avatar_url || user.avatar_url,
        full_name: updatedUser.full_name || user.full_name,
      }
      localStorage.setItem("user", JSON.stringify(newUserData))
      setUser(newUserData)
      setProfileSuccess("Profile updated successfully")
      setIsEditing(false)
      setProfileData({
        username: updatedUser.username,
        email: updatedUser.email,
        currentPassword: "",
        password: "",
        confirmPassword: "",
      })
      setCurrentPasswordVerified(false)
      setPasswordStrength("")
    } catch (error) {
      console.error("Error updating profile:", error)
      setProfileError(error.message || "An error occurred while updating profile")
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)
  const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword)

  return (
    <header className="headermain">
      <div
        className="layout"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "0 20px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="home-button" onClick={handleHomeClick}>
            <Home size={18} />
          </button>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className={`search-bar ${isSearchFocused ? "focused" : ""}`} ref={searchInputRef}>
              <Search size={18} className="search-icon" onClick={handleSearchSubmit} style={{ cursor: "pointer" }} />
              <input
                type="text"
                placeholder="Search for music, artists etc."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setSuggestions([]), 200)} // Ẩn gợi ý khi mất focus
              />
              {searchQuery && (
                <button type="button" className="clear-button" onClick={clearSearch}>
                  ×
                </button>
              )}
              {suggestions.length > 0 && isSearchFocused && (
                <div className="suggestions-dropdown">
                  {suggestions.map((artist, index) => (
                    <button
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(artist.artist_name)}
                    >
                      {artist.artist_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          {user ? (
            <div className="user-controls">
              <div className="user-avatar" onClick={handleAvatarClick} style={{ cursor: "pointer" }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url || "/placeholder.svg"} alt={user.username} className="avatar-image" />
                ) : (
                  <div className="avatar-fallback">{user.username?.charAt(0).toUpperCase() || "U"}</div>
                )}
              </div>
              <div className="notification-button-wrapper" style={{ position: "relative" }}>
                <button className="notification-button">
                  <Bell size={20} />
                </button>
                {unreadMessages > 0 && (
                  <span
                    className="unread-indicator"
                    style={{ position: "absolute", top: "0px", right: "0px", width: "8px", height: "8px", backgroundColor: "red", borderRadius: "50%" }}
                  />
                )}
              </div>
              <div className="settings-dropdown-container" ref={settingsDropdownRef}>
                <button className="settings-button" onClick={toggleSettingsDropdown}>
                  <Settings size={20} />
                </button>
                {showSettingsDropdown && (
                  <div className="settings-dropdown">
                    <div className="dropdown-separator"></div>
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <button className="login-button full-rounded" onClick={handleLoginClick}>
                <span>Login</span>
                <div className="border full-rounded"></div>
              </button>
              <button className="signup-button" onClick={handleRegisterClick}>
                <span>Signup</span>
              </button>
            </>
          )}
        </div>
      </div>
      {showProfileModal && user && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" ref={profileModalRef}>
            <button className="close-modal-button" onClick={() => setShowProfileModal(false)}>
              <X size={20} />
            </button>
            <div className="profile-modal-header">
              <div className="profile-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url || "/placeholder.svg"} alt={user.username} className="modal-avatar-image" />
                ) : (
                  <div className="modal-avatar-fallback">{user.username?.charAt(0).toUpperCase() || "U"}</div>
                )}
                <button className="avatar-upload-button">
                  <span className="camera-icon">
                    <Camera size={20} />
                  </span>
                </button>
              </div>
            </div>
            <div className="profile-modal-content">
              {profileError && <div className="profile-error-message">{profileError}</div>}
              {profileSuccess && <div className="profile-success-message">{profileSuccess}</div>}
              <div className="profile-field">
                <label htmlFor="username">Name:</label>
                {isEditing ? (
                  <input type="text" id="username" name="username" value={profileData.username} onChange={handleProfileChange} />
                ) : (
                  <div className="field-value">{user.username}</div>
                )}
              </div>
              <div className="profile-field">
                <label htmlFor="email">Email:</label>
                {isEditing ? (
                  <input type="email" id="email" name="email" value={profileData.email} onChange={handleProfileChange} />
                ) : (
                  <div className="field-value">{user.email}</div>
                )}
              </div>
              {isEditing && (
                <>
                  <div className="profile-field password-field">
                    <label htmlFor="currentPassword">Current Password:</label>
                    <div className="password-input-container">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        placeholder="Enter current password"
                        value={profileData.currentPassword}
                        onChange={handleProfileChange}
                        disabled={currentPasswordVerified}
                      />
                    </div>
                    {!currentPasswordVerified && (
                      <button
                        type="button"
                        className="verify-password-button"
                        onClick={verifyCurrentPassword}
                        disabled={!profileData.currentPassword || isVerifyingPassword}
                      >
                        {isVerifyingPassword ? "Verifying..." : "Verify Password"}
                      </button>
                    )}
                    {currentPasswordVerified && <div className="password-verified">Password verified ✓</div>}
                  </div>
                  {currentPasswordVerified && (
                    <>
                      <div className="profile-field password-field">
                        <label htmlFor="password">New Password (optional):</label>
                        <div className="password-input-container">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            placeholder="Enter new password"
                            value={profileData.password}
                            onChange={handleProfileChange}
                          />
                        </div>
                        {passwordStrength && (
                          <div className={`password-strength ${passwordStrength}`}>Password is {passwordStrength}</div>
                        )}
                      </div>
                      <div className="profile-field password-field">
                        <label htmlFor="confirmPassword">Confirm New Password:</label>
                        <div className="password-input-container">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm new password"
                            value={profileData.confirmPassword}
                            onChange={handleProfileChange}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="profile-modal-footer">
              {isEditing ? (
                <>
                  <button className="save-button" onClick={handleSaveProfile} disabled={!currentPasswordVerified}>
                    SAVE
                  </button>
                  <button className="cancel-button" onClick={handleCancelEdit}>
                    CANCEL
                  </button>
                </>
              ) : (
                <button className="edit-profile-button" onClick={handleEditProfile}>
                  <Edit size={16} />
                  EDIT PROFILE
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .headermain .search-bar {
          position: relative;
        }
        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: #2a2a2a;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
        }
        .suggestion-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          color: #fff;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
        }
        .suggestion-item:hover {
          background-color: #3a3a3a;
        }
         .profile-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .profile-modal {
          background-color: #2a2a2a;
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          padding: 24px;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .close-modal-button {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
        }

        .profile-modal-header {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .profile-avatar {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .modal-avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .modal-avatar-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          color: #666;
        }

        .avatar-upload-button {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f0f2f5;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .profile-modal-content {
          margin-bottom: 24px;
        }

        .profile-error-message {
          color: #e53935;
          margin-bottom: 16px;
          padding: 8px;
          background-color: #ffebee;
          border-radius: 4px;
          font-size: 14px;
        }

        .profile-success-message {
          color: #388e3c;
          margin-bottom: 16px;
          padding: 8px;
          background-color: #e8f5e9;
          border-radius: 4px;
          font-size: 14px;
        }

        .profile-field {
          margin-bottom: 16px;
        }

        .profile-field label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
          color: #666;
        }

        .profile-field input {
          width: 100%;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          margin-top: 20px;
          background: #3a3a3a;
          color: #fff;
        }

        .field-value {
          padding: 8px 0;
          font-size: 16px;
        }

        .password-field {
          position: relative;
        }

        .password-input-container {
          position: relative;
        }

     
        .profile-modal-footer {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .edit-profile-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #5b5fc7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .save-button {
          padding: 8px 24px;
          background-color: #5b5fc7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          flex: 1;
        }

        .save-button:disabled {
          background-color: #9e9e9e;
          cursor: not-allowed;
        }

        .cancel-button {
          padding: 8px 24px;
          background-color: white;
          color: #666;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          flex: 1;
        }

        .verify-password-button {
          margin-top: 8px;
          padding: 6px 12px;
          background-color: #5b5fc7;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .verify-password-button:disabled {
          background-color: #9e9e9e;
          cursor: not-allowed;
        }

        .password-verified {
          margin-top: 5px;
          font-size: 12px;
          color: #388e3c;
          background-color: #e8f5e9;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .password-strength {
          margin-top: 5px;
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .password-strength.weak {
          background-color: #ffebee;
          color: #d32f2f;
        }

        .password-strength.medium {
          background-color: #fff8e1;
          color: #ff8f00;
        }

        .password-strength.strong {
          background-color: #e8f5e9;
          color: #388e3c;
        }
      `}</style>
    </header>
  )
}

export default Header