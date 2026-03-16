"use client"
import { useState, useEffect, useRef } from "react"
import { X, Download, Share2, ThumbsUp, Heart, MoreHorizontal, Play } from "lucide-react"
import axios from "axios"
import moment from "moment"
import { formatDuration, formatViewCount } from "../utils/helpers"

const VideoDetail = ({ videoId, onClose }) => {
  const [video, setVideo] = useState(null)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const videoRef = useRef(null)
  const modalRef = useRef(null)
  const [currentVideoId, setCurrentVideoId] = useState(videoId)
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const progressBarRef = useRef(null)

  useEffect(() => {
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = "hidden"

    // Fetch video details
    const fetchVideoDetails = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/videos/${currentVideoId}`)
        setVideo(response.data)

        // Fetch related videos by the same artist
        if (response.data.artist_id) {
          const relatedResponse = await axios.get(`/api/artists/${response.data.artist_id}/videos`)
          // Filter out the current video from related videos
          const filteredRelated = Array.isArray(relatedResponse.data)
            ? relatedResponse.data.filter((v) => v.video_id !== currentVideoId)
            : []
          setRelatedVideos(filteredRelated)
        }
      } catch (err) {
        console.error("Error fetching video details:", err)
        setError(err.message || "Không thể tải video")
      } finally {
        setLoading(false)
      }
    }

    fetchVideoDetails()

    // Check if video is liked or favorited
    const checkUserInteractions = () => {
      const likedVideos = JSON.parse(localStorage.getItem("likedVideos") || "[]")
      const favoriteVideos = JSON.parse(localStorage.getItem("favoriteVideos") || "[]")
      setIsLiked(likedVideos.includes(currentVideoId))
      setIsFavorite(favoriteVideos.includes(currentVideoId))
    }

    checkUserInteractions()

    // Cleanup function
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [currentVideoId])

  const handleClose = (e) => {
    // Close only if clicking on the backdrop or close button
    if (e.target === modalRef.current || e.currentTarget.dataset.close === "true") {
      if (videoRef.current) {
        videoRef.current.pause()
      }
      onClose()
    }
  }

  const handleLike = () => {
    const likedVideos = JSON.parse(localStorage.getItem("likedVideos") || "[]")

    if (isLiked) {
      const updatedLikes = likedVideos.filter((id) => id !== currentVideoId)
      localStorage.setItem("likedVideos", JSON.stringify(updatedLikes))
    } else {
      likedVideos.push(currentVideoId)
      localStorage.setItem("likedVideos", JSON.stringify(likedVideos))
    }

    setIsLiked(!isLiked)
  }

  const handleFavorite = () => {
    const favoriteVideos = JSON.parse(localStorage.getItem("favoriteVideos") || "[]")

    if (isFavorite) {
      const updatedFavorites = favoriteVideos.filter((id) => id !== currentVideoId)
      localStorage.setItem("favoriteVideos", JSON.stringify(updatedFavorites))
    } else {
      favoriteVideos.push(currentVideoId)
      localStorage.setItem("favoriteVideos", JSON.stringify(favoriteVideos))
    }

    setIsFavorite(!isFavorite)
  }

  const handleRelatedVideoClick = (relatedVideoId) => {
    if (videoRef.current) {
      videoRef.current.pause()
    }
    // Navigate to the new video within the modal
    window.history.pushState({}, "", `/video/${relatedVideoId}`)
    setVideo(null)
    setLoading(true)
    setCurrentVideoId(relatedVideoId)
  }

  const handleDownload = async () => {
    if (!video) return

    try {
      const downloadUrl = `/api/videos/${video.video_id}/stream/`
      const filename = `${video.title || "video"}.mp4`

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert(`Video "${filename}" đang được tải xuống.`)
    } catch (error) {
      console.error("Error downloading video:", error)
      alert("Lỗi khi tải xuống video: " + error.message)
    }
  }

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleVideoDurationChange = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration)
    }
  }

  const handleVideoPlay = () => {
    setIsVideoPlaying(true)
  }

  const handleVideoPause = () => {
    setIsVideoPlaying(false)
  }

  const handleVideoSeek = (e) => {
    if (!progressBarRef.current || !videoRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    const newTime = position * videoDuration

    if (Number.isFinite(newTime) && newTime >= 0 && newTime <= videoDuration) {
      videoRef.current.currentTime = newTime
      setVideoCurrentTime(newTime)
    }
  }

  const formatVideoTime = (time) => {
    if (!time) return "0:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="video-modal-overlay" ref={modalRef} onClick={handleClose}>
        <div className="video-modal-content">
          <div className="video-modal-loading">
            <div className="spinner"></div>
            <p>Đang tải video...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="video-modal-overlay" ref={modalRef} onClick={handleClose}>
        <div className="video-modal-content">
          <div className="video-modal-error">
            <p>Lỗi: {error}</p>
            <button data-close="true" onClick={handleClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="video-modal-overlay" ref={modalRef} onClick={handleClose}>
        <div className="video-modal-content">
          <div className="video-modal-error">
            <p>Không tìm thấy video</p>
            <button data-close="true" onClick={handleClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="video-modal-overlay" ref={modalRef} onClick={handleClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="video-modal-close" data-close="true" onClick={handleClose}>
          <X size={24} />
        </button>

        <div className="video-modal-layout">
          <div className="video-modal-main">
            <div className="video-player-container">
              <video
                ref={videoRef}
                src={`/api/videos/${video.video_id}/stream/`}
                poster={video.thumbnail_url || video.video_url?.replace(".mp4", ".jpg")}
                controls
                autoPlay
                className="video-player"
                onTimeUpdate={handleVideoTimeUpdate}
                onDurationChange={handleVideoDurationChange}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
              />

              <div className="video-custom-controls">
                <div className="video-time-display">
                  {formatVideoTime(videoCurrentTime)} / {formatVideoTime(videoDuration)}
                </div>
                <div className="video-progress-container" ref={progressBarRef} onClick={handleVideoSeek}>
                  <div
                    className="video-progress-bar"
                    style={{ width: `${(videoCurrentTime / videoDuration) * 100 || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="video-details">
              <h1 className="video-title">{video.title}</h1>

              <div className="video-meta">
                <div className="video-meta-info">
                  <p className="video-views">{formatViewCount(video.listeners || 0)} lượt xem</p>
                  <p className="video-date">{moment(video.created_at).format("DD/MM/YYYY")}</p>
                </div>

                <div className="video-actions">
                  <button className={`video-action-button ${isLiked ? "active" : ""}`} onClick={handleLike}>
                    <ThumbsUp size={20} />
                    <span>Thích</span>
                  </button>
                  <button className={`video-action-button ${isFavorite ? "active" : ""}`} onClick={handleFavorite}>
                    <Heart size={20} />
                    <span>Yêu thích</span>
                  </button>
                  <button className="video-action-button" onClick={handleDownload}>
                    <Download size={20} />
                    <span>Tải xuống</span>
                  </button>
                  <button className="video-action-button">
                    <Share2 size={20} />
                    <span>Chia sẻ</span>
                  </button>
                  <button className="video-action-button">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              <div className="video-channel">
                <div className="channel-info">
                  <div className="channel-avatar">
                    <img
                      src={video.artist_image || "/placeholder.svg"}
                      alt={video.artist_name}
                      onError={(e) => (e.target.src = "/placeholder.svg")}
                    />
                  </div>
                  <div className="channel-details">
                    <h3 className="channel-name">{video.artist_name}</h3>
                    <p className="channel-subscribers">{formatViewCount(video.artist_followers || 0)} người theo dõi</p>
                  </div>
                </div>
                <button className="subscribe-button">Theo dõi</button>
              </div>

              <div className="video-description">
                <p>{video.description || "Không có mô tả cho video này."}</p>
              </div>
            </div>
          </div>

          <div className="video-modal-sidebar">
            <h3 className="related-videos-title">Video liên quan</h3>
            <div className="related-videos-list">
              {relatedVideos.length > 0 ? (
                relatedVideos.map((relatedVideo) => (
                  <div
                    key={relatedVideo.video_id}
                    className="related-video-item"
                    onClick={() => handleRelatedVideoClick(relatedVideo.video_id)}
                  >
                    <div className="related-video-thumbnail">
                      <img
                        src={
                          relatedVideo.thumbnail_url ||
                          relatedVideo.video_url?.replace(".mp4", ".jpg") ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt={relatedVideo.title}
                        onError={(e) => (e.target.src = "/placeholder.svg")}
                      />
                      <span className="related-video-duration">{formatDuration(relatedVideo.duration || 0)}</span>
                      <div className="related-video-play">
                        <Play size={24} fill="white" />
                      </div>
                    </div>
                    <div className="related-video-info">
                      <h4 className="related-video-title">{relatedVideo.title}</h4>
                      <p className="related-video-artist">{relatedVideo.artist_name}</p>
                      <p className="related-video-meta">
                        {formatViewCount(relatedVideo.listeners || 0)} lượt xem •{" "}
                        {moment(relatedVideo.created_at).fromNow()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-related-videos">Không có video liên quan</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoDetail
