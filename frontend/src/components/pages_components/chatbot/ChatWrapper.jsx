"use client"

import { useEffect, useState } from "react"
import MusicChatbot from "."

const ChatWrapper = () => {
  const [userId, setUserId] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Get user ID from localStorage or session
    // This should match how your app stores the current user
    const storedUser = localStorage.getItem("currentUser")

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUserId(userData.user_id?.toString() || userData.id?.toString())
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    setIsLoaded(true)
  }, [])

  if (!isLoaded) return null

  // If no user is logged in, use a temporary guest ID
  const chatUserId = userId || `guest-${Math.random().toString(36).substring(2, 9)}`

  return <MusicChatbot userId={chatUserId} />
}

export default ChatWrapper
