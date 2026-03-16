"use client"
import { useEffect, useState } from "react"
import moment from "moment"
import { useNavigate } from "react-router-dom"
import { formatDuration, formatViewCount, downloadFile } from "../utils/helpers"

const Videos = ({ addToQueue, onVideoClick }) => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const navigate = useNavigate()

  // Fetch with retry logic (giống TopCharts.jsx, NewAlbums.jsx, Artists.jsx)
  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          const text = await response.text()
          let errorData
          try {
            errorData = JSON.parse(text)
          } catch {
            errorData = { error: `HTTP error! status: ${response.status}`, details: text || "No response body" }
          }
          throw new Error(`${errorData.error}: ${errorData.details || "No details"}`)
        }
        return await response.json()
      } catch (error) {
        if (i === retries - 1) {
          console.error(`Failed after ${retries} retries for ${url}:`, error)
          throw error
        }
        console.warn(`Retry ${i + 1}/${retries} for ${url}: ${error.message}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await fetchWithRetry("/api/videos/", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        const formattedVideos = Array.isArray(data)
          ? data.map((video) => ({
              video_id: video.video_id,
              title: video.title || "Unknown Video",
              artist_name: video.artist_name || "Unknown Artist",
              artist_id: video.artist_id,
              video_url: video.video_url || "/placeholder.svg",
              duration: video.duration || 0,
              listeners: video.listeners || 0,
              created_at: video.created_at || new Date(),
            }))
          : []
        setVideos(formattedVideos)
      } catch (error) {
        console.error("Error fetching videos:", error)
        setError(error.message || "Không thể tải video. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  const handleVideoClick = (video, event) => {
    if (event.target.closest(".download-button")) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    if (onVideoClick) {
      event.preventDefault()
      onVideoClick(video.video_id)
    } else {
      navigate(`/video/${video.video_id}`)
    }
  }

  const handleDownload = async (video, event) => {
    event.preventDefault()
    event.stopPropagation()

    if (downloadingId === video.video_id) return

    try {
      setDownloadingId(video.video_id)
      const downloadUrl = `/api/videos/${video.video_id}/stream/`
      const filename = `${video.title || "video"}.mp4`

      const response = await fetch(downloadUrl, {
        method: "GET",
      })

      if (!response.ok) {
        const text = await response.text()
        let errorData
        try {
          errorData = JSON.parse(text)
        } catch {
          errorData = { error: `HTTP error! status: ${response.status}`, details: text || "No response body" }
        }
        console.error("Error downloading video:", `${errorData.error}: ${errorData.details || "No details"}`)
        throw new Error(`${errorData.error}: ${errorData.details || "No details"}`)
      }

      const success = await downloadFile(downloadUrl, filename)

      if (success) {
        alert(`Video "${filename}" đang được tải xuống.`)
      } else {
        alert("Không thể tải xuống video. Vui lòng thử lại sau.")
      }
    } catch (error) {
      console.error("Error downloading video:", error)
      alert(error.message || "Lỗi khi tải xuống video. Vui lòng thử lại sau.")
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) return <div className="videos-loading">Đang tải...</div>
  if (error) return <div className="videos-error">Lỗi: {error}</div>

  const displayedVideos = videos.slice(0, 6)

  if (!displayedVideos.length) {
    return (
      <section className="videos-section">
        <div className="section-header">
          <h2 className="section-title">Videos</h2>
          <a href="/videos" className="see-all">
            Xem tất cả
          </a>
        </div>
        <p>Không có video nào.</p>
      </section>
    )
  }

  return (
    <section className="videos-section">
      <div className="section-header">
        <h2 className="section-title">Videos</h2>
        <a href="/videos" className="see-all">
          Xem tất cả
        </a>
      </div>
      <div className="videos-list">
        {displayedVideos.map((video) => (
          <div
            key={video.video_id}
            className="video-item"
            onClick={(e) => handleVideoClick(video, e)}
            onMouseEnter={(e) => {
              const videoElement = e.currentTarget.querySelector("video")
              if (videoElement) {
                videoElement.play().catch((err) => console.log("Autoplay prevented:", err))
              }
            }}
            onMouseLeave={(e) => {
              const videoElement = e.currentTarget.querySelector("video")
              if (videoElement) {
                videoElement.pause()
                videoElement.currentTime = 0
              }
            }}
          >
            <div className="video-thumbnail">
              {video.video_url ? (
                <>
                  <video
                    src={`/api/videos/${video.video_id}/stream/`}
                    poster={video.video_url.replace(".mp4", ".jpg")}
                    muted
                    preload="none"
                    loop
                  />
                  <img
                    src={video.video_url.replace(".mp4", ".jpg") || "/placeholder.svg"}
                    alt={video.title}
                    onError={(e) => (e.target.src = "/placeholder.svg")}
                  />
                </>
              ) : (
                <div className="thumbnail-placeholder">No Thumbnail</div>
              )}
              <span className="video-duration">{formatDuration(video.duration)}</span>
            </div>
            <div className="video-info">
              <h3 className="video-title">{video.title}</h3>
              <p className="video-artist">{video.artist_name}</p>
              <p className="video-meta">
                {formatViewCount(video.listeners)} • {moment(video.created_at).fromNow()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Videos