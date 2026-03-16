"use client"

import { useState, useEffect } from "react"
import { FaGoogle, FaFacebook } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import "./style/PageSignup.css"

const PageSignup = () => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState("")

  useEffect(() => {
    const container = document.querySelector(".signup-container")
    let position = 0
    const moveBackground = () => {
      position += 0.5
      container.style.backgroundPosition = `${position}px 50%`
      requestAnimationFrame(moveBackground)
    }
    moveBackground()
  }, [])

  const navigate = useNavigate()
  const handleLoginpage = () => {
    navigate("/login")
  }

  const checkPasswordStrength = (pwd) => {
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

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    setPasswordStrength(checkPasswordStrength(newPassword))
  }

  const handleSignup = async (e) => {
    e.preventDefault()

    // Add username validation
    if (!username) {
      alert("Please enter a username")
      return
    }
    if (!email || !password) {
      alert("Please enter both email and password")
      return
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!")
      return
    }
    if (passwordStrength === "weak") {
      alert(
        "Password is too weak! It must include at least 3 of the following: 8+ characters, uppercase letters, lowercase letters, numbers, and special characters."
      )
      return
    }

    try {
      const response = await fetch("/api/signup/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          passwordStrength,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Account created successfully!")
        navigate("/login")
      } else {
        alert(data.message || "Signup failed. Please try again.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred during signup. Please try again.")
    }
  }

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google/"
  }

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1>Signup to Spotify</h1>

        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              required
            />
            {passwordStrength && (
              <p className={`password-strength ${passwordStrength}`}>
                Password is {passwordStrength}
              </p>
            )}
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
          </div>
          <button type="submit" className="signup-btn">
            Signup
          </button>
          <div className="divider">
            <div className="divider-line-left"></div>
            <div className="divider-text">or</div>
            <div className="divider-right-right"></div>
          </div>
          <button type="button" className="social-signup-btn google-signup-btn" onClick={handleGoogleSignup}>
            <FaGoogle /> Signup with Google
          </button>
          <button type="button" className="social-signup-btn facebook-signup-btn">
            <FaFacebook /> Signup with Facebook
          </button>
        </form>
        <div className="login-text">
          <span>Already had account? </span>
          <a href="#" onClick={handleLoginpage}>
            Login to Spotify
          </a>
        </div>
      </div>
    </div>
  )
}

export default PageSignup