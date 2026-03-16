// FavoriteService.jsx
"use client"

const FAVORITES_STORAGE_KEY = "favoriteSongs"

export const FavoriteService = {
  // Lấy danh sách bài hát yêu thích từ localStorage
  getFavorites: () => {
    try {
      const favoritesData = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (favoritesData) {
        return JSON.parse(favoritesData)
      }
    } catch (error) {
      console.error("Error getting favorite songs:", error)
    }
    return []
  },

  // Kiểm tra một bài hát có được yêu thích hay không
  isFavorite: (songId) => {
    try {
      const favorites = FavoriteService.getFavorites()
      return favorites.some((song) => song.song_id === songId)
    } catch (error) {
      console.error("Error checking if song is favorite:", error)
      return false
    }
  },

  // Thêm hoặc xóa bài hát khỏi danh sách yêu thích
  toggleFavorite: (song) => {
    try {
      if (!song || !song.song_id) {
        console.error("Invalid song data:", song)
        return false
      }

      const favorites = FavoriteService.getFavorites()
      const isLiked = favorites.some((fav) => fav.song_id === song.song_id)

      let updatedFavorites
      if (!isLiked) {
        // Định dạng bài hát để đảm bảo tính nhất quán
        const formattedSong = {
          song_id: song.song_id,
          title: song.title || "Unknown Title",
          artist_name: song.artist_name || (song.artist && song.artist.artist_name) || "Unknown Artist",
          duration: song.duration || 0,
          image_url: song.image_url || song.cover || "/placeholder.svg",
          audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
        }
        updatedFavorites = [...favorites, formattedSong]
      } else {
        updatedFavorites = favorites.filter((fav) => fav.song_id !== song.song_id)
      }

      // Lưu vào localStorage
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updatedFavorites))

      // Cập nhật trạng thái like cho bài hát cụ thể
      localStorage.setItem(`liked_${song.song_id}`, (!isLiked).toString())

      // Thông báo cho các component khác biết về sự thay đổi
      window.dispatchEvent(new CustomEvent("songLikeChanged", { detail: { songId: song.song_id } }))

      return !isLiked
    } catch (error) {
      console.error("Error toggling favorite:", error)
      return false
    }
  },

  // Đồng bộ với backend nếu người dùng đã đăng nhập
  syncWithBackend: (songId, isLiked) => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        return fetch(`/api/users/${userData.user_id}/likes/`, {
          method: isLiked ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_id: songId }),
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response
        })
      } catch (error) {
        console.error("Error syncing favorites with backend:", error)
        return Promise.reject(error)
      }
    }
    return Promise.resolve(null)
  },
}
