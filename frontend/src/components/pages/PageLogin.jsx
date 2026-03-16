"use client"

import { useState, useEffect } from "react"
import { FaGoogle, FaFacebook } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import "./style/PageLogin.css"

const PageLogin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const navigate = useNavigate()

  // Chỉ chạy hiệu ứng background, không kiểm tra đăng nhập ở đây
  useEffect(() => {
    const container = document.querySelector(".login-container")
    let position = 0
    const moveBackground = () => {
      position += 0.5
      if (container) {
        container.style.backgroundPosition = `${position}px 50%`
      }
      requestAnimationFrame(moveBackground)
    }
    moveBackground()

    return () => {
      cancelAnimationFrame(moveBackground)
    }
  }, [])

  const handleSignup = () => {
    navigate("/signup")
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email || !password) {
      setError("Please enter both email and password")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("Login response:", response.status, data)

      if (response.ok) {
        // Lưu thông tin người dùng
        const userData = data.user || { email }
        localStorage.setItem("user", JSON.stringify(userData))
        window.dispatchEvent(new Event("userLogin"))

        console.log("Login successful, redirecting to /main")
        navigate("/main", { replace: true })
      } else {
        setError(data.message || "Invalid email or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Failed to connect to the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google/"
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login to Spotify</h1>

        {error && (
          <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          className="social-login-btn google-login-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <FaGoogle /> Login with Google
        </button>
        <button
          type="button"
          className="social-login-btn facebook-login-btn"
          disabled={loading}
        >
          <FaFacebook /> Login with Facebook
        </button>
        <div className="divider">
          <div className="divider-line"></div>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email or username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="Email or username"
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              required
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="forgot-password">
          <a href="#">Forgot your password?</a>
        </div>
        <div className="signup-text">
          <span>Don't have an account? </span>
          <a href="#" onClick={handleSignup}>
            Signup to Spotify
          </a>
        </div>
      </div>
    </div>
  )
}

export default PageLogin