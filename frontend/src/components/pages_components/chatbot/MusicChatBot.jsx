"use client"

import { useState, useEffect, useRef } from "react"
import ChatBubble from "./ChatBubble"
import "./MusicChatbot.css"

// Mock AI response function (replace with actual API call in production)
const generateAIResponse = async (messages, userId) => {
  // In a real implementation, this would call your backend API
  // For now, we'll simulate a response

  const lastMessage = messages[messages.length - 1]

  // Simple response logic based on keywords
  let response = "I'm not sure how to help with that. Can you try asking about music recommendations or app features?"

  const lowercaseContent = lastMessage.content.toLowerCase()

  if (lowercaseContent.includes("recommend") || lowercaseContent.includes("suggest")) {
    if (lowercaseContent.includes("rock")) {
      response =
        "For rock music, I'd recommend checking out artists like AC/DC, Led Zeppelin, or newer bands like Greta Van Fleet. You might also enjoy our 'Classic Rock Essentials' playlist!"
    } else if (lowercaseContent.includes("pop")) {
      response =
        "For pop music, try listening to Taylor Swift, The Weeknd, or Dua Lipa. Our 'Today's Top Hits' playlist is updated weekly with the best new pop songs."
    } else if (lowercaseContent.includes("jazz")) {
      response =
        "For jazz, I recommend Miles Davis, John Coltrane, or for something more contemporary, try Kamasi Washington. Check out our 'Jazz Classics' playlist!"
    } else {
      response =
        "I'd be happy to recommend some music! What genres do you enjoy? We have great playlists for pop, rock, jazz, hip-hop, classical, and many more."
    }
  } else if (lowercaseContent.includes("playlist")) {
    response =
      "You can create and manage playlists by clicking on the 'Playlists' section in the sidebar. To add a song to a playlist, right-click on any song and select 'Add to Playlist'."
  } else if (lowercaseContent.includes("hello") || lowercaseContent.includes("hi")) {
    response =
      "Hello! I'm your music assistant. I can help you discover new music, create playlists, or learn how to use the app. What would you like to know?"
  } else if (lowercaseContent.includes("thank")) {
    response = "You're welcome! Feel free to ask if you need any more help with music recommendations or app features."
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return response
}

const MusicChatbot = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  // Set up message cleanup interval (check every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      if (messages.length > 0) {
        const now = Date.now()
        const fiveMinutesInMs = 5 * 60 * 1000

        setMessages((prevMessages) => prevMessages.filter((msg) => now - msg.timestamp < fiveMinutesInMs))
      }
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [messages])

  // Load messages from localStorage when component mounts
  useEffect(() => {
    if (isOpen && userId) {
      try {
        const savedMessages = localStorage.getItem(`chat_messages_${userId}`)
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages)

          // Filter out messages older than 5 minutes
          const now = Date.now()
          const fiveMinutesInMs = 5 * 60 * 1000
          const recentMessages = parsedMessages.filter((msg) => now - msg.timestamp < fiveMinutesInMs)

          setMessages(recentMessages)
        }
      } catch (error) {
        console.error("Failed to load messages:", error)
      }
    }
  }, [isOpen, userId])

  // Save messages to localStorage when they change
  useEffect(() => {
    if (userId && messages.length > 0) {
      localStorage.setItem(`chat_messages_${userId}`, JSON.stringify(messages))
    }
  }, [messages, userId])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Get AI response
      const response = await generateAIResponse([...messages, userMessage], userId)

      const assistantMessage = {
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to get AI response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="music-chatbot-container">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="chat-button" aria-label="Open chat">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </button>
      ) : (
        <div className="chat-card">
          <div className="chat-header">
            <h3 className="chat-title">Music Assistant</h3>
            <div className="chat-actions">
              <button onClick={() => setIsOpen(false)} className="chat-action-button" aria-label="Minimize chat">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 14 10 14 10 20"></polyline>
                  <polyline points="20 10 14 10 14 4"></polyline>
                  <line x1="14" y1="10" x2="21" y2="3"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} className="chat-action-button" aria-label="Close chat">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className="chat-content">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <p>Hi! I can help you discover music and navigate the app. Ask me anything!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatBubble key={index} message={message} timestamp={message.timestamp} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            <div className="chat-input-container">
              <input
                type="text"
                placeholder="Ask about music or features..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="chat-input"
              />
              <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="chat-send-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MusicChatbot
