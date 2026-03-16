// SongHistoryService.jsx
"use client"

const HISTORY_STORAGE_KEY = "songHistory"
const MAX_HISTORY_ITEMS = 100

export const SongHistoryService = {
  getHistory: () => {
    try {
      const historyData = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (historyData) {
        return JSON.parse(historyData)
      }
    } catch (error) {
      console.error("Error getting song history:", error)
    }
    return []
  },

  addToHistory: (song) => {
    try {
      const history = SongHistoryService.getHistory()
      const today = new Date().toISOString().split("T")[0] // Get current date in YYYY-MM-DD format
      const existingIndex = history.findIndex((s) => s.song_id === song.song_id)

      const historySong = {
        song_id: song.song_id,
        title: song.title || "Unknown Title",
        artist: song.artist || { artist_name: song.artist_name || "Unknown Artist" },
        artist_name: song.artist?.artist_name || song.artist_name || "Unknown Artist",
        duration: song.duration || 0,
        image_url: song.image_url || song.cover || "/placeholder.svg",
        audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
        lastPlayed: song.lastPlayed || new Date().toISOString(),
        playCount: song.playCount || 1,
        // Add daily play counts
        dailyPlays: song.dailyPlays || {
          [today]: 1,
        },
      }

      if (existingIndex !== -1) {
        // Update existing song
        const existingSong = history[existingIndex]
        const dailyPlays = existingSong.dailyPlays || {}

        // Update or initialize today's play count
        dailyPlays[today] = (dailyPlays[today] || 0) + 1

        historySong.dailyPlays = dailyPlays
        historySong.playCount = (existingSong.playCount || 0) + 1

        history[existingIndex] = historySong
      } else {
        history.unshift(historySong)
        if (history.length > MAX_HISTORY_ITEMS) {
          history.pop()
        }
      }

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))

      // Sync with backend
      const userData = localStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        const userId = user?.user_id
        if (userId) {
          fetch(`/api/users/${userId}/listening_history/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              song_id: song.song_id,
              date: today,
              play_count: historySong.dailyPlays[today],
            }),
          }).catch((error) => console.error("Error syncing history with backend:", error))
        }
      }
    } catch (error) {
      console.error("Error adding song to history:", error)
    }
  },

  clearHistory: () => {
    try {
      const userData = localStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        const userId = user?.user_id
        if (userId) {
          fetch(`/api/users/${userId}/listening_history/`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          }).catch((error) => console.error("Error clearing history on backend:", error))
        }
      }
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    } catch (error) {
      console.error("Error clearing history:", error)
    }
  },

  removeSong: (songId) => {
    try {
      const history = SongHistoryService.getHistory()
      const updatedHistory = history.filter((song) => song.song_id !== songId)
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
    } catch (error) {
      console.error("Error removing song from history:", error)
    }
  },
}

export const useTrackSongPlay = () => {
  const trackPlay = (song) => {
    if (song && song.song_id) {
      SongHistoryService.addToHistory(song)
    }
  }

  return { trackPlay }
}
