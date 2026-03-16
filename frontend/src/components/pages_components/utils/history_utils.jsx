// Utility function to save played songs to history

/**
 * @typedef {Object} HistorySong
 * @property {string} id - Song ID
 * @property {string} title - Song title
 * @property {Object|string} artist - Artist object or string
 * @property {string} [artist_name] - Artist name
 * @property {number} duration - Song duration in seconds
 * @property {string} [cover] - Cover image URL
 * @property {string} [image_url] - Alternative image URL
 * @property {string} audio_url - Audio file URL
 * @property {number} playCount - Number of times the song was played
 * @property {string} lastPlayed - ISO timestamp of last play
 */

/**
 * Saves a played song to history in localStorage
 * @param {Object} song - The song to save to history
 */
export const saveToHistory = (song) => {
    if (!song?.id) return
  
    try {
      // Format the song for history
      const historySong = {
        id: song.id,
        title: song.title,
        artist: song.artist || { artist_name: song.artist_name || "Unknown Artist" },
        artist_name: song.artist_name,
        duration: song.duration || 0,
        cover: song.cover || song.image_url,
        image_url: song.cover || song.image_url,
        audio_url: song.audio_url,
        playCount: 1,
        lastPlayed: new Date().toISOString(),
      }
  
      // Get existing history
      const historyData = localStorage.getItem("songHistory")
      let history = []
  
      if (historyData) {
        history = JSON.parse(historyData)
  
        // Check if song already exists in history
        const existingIndex = history.findIndex((item) => item.id === song.id)
  
        if (existingIndex !== -1) {
          // Update existing song
          history[existingIndex] = {
            ...history[existingIndex],
            playCount: history[existingIndex].playCount + 1,
            lastPlayed: new Date().toISOString(),
          }
        } else {
          // Add new song to history
          history.push(historySong)
        }
      } else {
        // Create new history with this song
        history = [historySong]
      }
  
      // Limit history to 100 items to prevent localStorage from getting too large
      if (history.length > 100) {
        history = history.slice(-100)
      }
  
      // Save updated history
      localStorage.setItem("songHistory", JSON.stringify(history))
    } catch (error) {
      console.error("Error saving song to history:", error)
    }
  }
    