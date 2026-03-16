"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, RefreshCw, MoreVertical, Music, List } from "lucide-react";
import SongActions from "../ui/SongActions";
import LoginModal from "../ui/LoginModal";

function PlaylistDetail({ playSong, currentSong, addToQueue, playNext }) {
  const [playlist, setPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [suggestedSongs, setSuggestedSongs] = useState([]);
  const [likedSongs, setLikedSongs] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hoveredSong, setHoveredSong] = useState(null);
  const { playlist_number } = useParams();
  const navigate = useNavigate();

  // Hàm chuẩn hóa định dạng bài hát
  const formatSong = useCallback(
    (song) => ({
      song_id: song.song_id,
      title: song.title || "Unknown Title",
      artist: { artist_name: song.artist || "Unknown Artist" },
      duration: song.duration.includes(":")
        ? song.duration
            .split(":")
            .reduce((acc, time) => 60 * acc + Number(time), 0)
        : song.duration || 0,
      image_url: song.image || "/placeholder.svg",
      audio_url: `/api/songs/${song.song_id}/stream/`,
      isPlaying: true,
    }),
    [],
  );

  // Hàm cập nhật queue trong localStorage
  const updateQueue = useCallback((updateFn) => {
    const queue = JSON.parse(localStorage.getItem("playingQueue") || "[]");
    const updatedQueue = updateFn(queue);
    localStorage.setItem("playingQueue", JSON.stringify(updatedQueue));
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setShowLoginModal(true);
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (!userData.user_id) {
        throw new Error("Invalid user data: user_id missing");
      }
      setUser(userData);
    } catch (err) {
      console.error("Invalid user data:", err);
      localStorage.removeItem("user");
      setShowLoginModal(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!playlist_number || !/^\d+$/.test(playlist_number)) {
      setError(`Invalid playlist number: "${playlist_number || "undefined"}"`);
      setLoading(false);
      navigate("/main");
      return;
    }

    const parsedPlaylistNumber = parseInt(playlist_number, 10);

    const fetchPlaylistData = async () => {
      try {
        const playlistResponse = await fetch(
          `http://localhost:8000/api/users/${user.user_id}/playlists/${parsedPlaylistNumber}/`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!playlistResponse.ok) {
          const errData = await playlistResponse.json();
          throw new Error(errData.error || `Playlist not found (${playlistResponse.status})`);
        }
        const playlistData = await playlistResponse.json();
        if (!playlistData || !playlistData.playlist_name) {
          throw new Error("Invalid playlist data");
        }
        setPlaylist(playlistData);

        const songsResponse = await fetch(
          `http://localhost:8000/api/users/${user.user_id}/playlists/${parsedPlaylistNumber}/songs/`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!songsResponse.ok) {
          const errData = await songsResponse.json();
          throw new Error(errData.error || `Failed to fetch songs (${songsResponse.status})`);
        }
        const songsData = await songsResponse.json();
        if (!Array.isArray(songsData)) {
          throw new Error("Invalid songs data: expected an array");
        }
        const formattedSongs = songsData.map((song) => ({
          song_id: song.song_id,
          title: song.title || "Unknown Title",
          artist: song.artist_name || "Unknown Artist",
          duration: formatDuration(song.duration || 0),
          album: song.album_title || "",
          image: song.image_url || "/placeholder.svg?height=60&width=60",
        }));
        setPlaylistSongs(formattedSongs);
      } catch (error) {
        console.error("Error fetching playlist or songs:", error);
        setError(error.message);
      }
    };

    const fetchSuggestedSongs = async () => {
      try {
        const response = await fetch("/api/songs/random/?limit=6");
        if (!response.ok) {
          throw new Error(`Failed to fetch suggested songs: ${response.status}`);
        }
        const data = await response.json();
        const formattedSongs = data.map((song) => ({
          song_id: song.song_id,
          title: song.title || "Unknown Title",
          artist: song.artist_name || "Unknown Artist",
          duration: formatDuration(song.duration || 0),
          album: song.album_title || "",
          image: song.image_url || "/placeholder.svg?height=60&width=60",
        }));
        setSuggestedSongs(formattedSongs);
      } catch (error) {
        console.error("Error fetching suggested songs:", error);
        setError(error.message);
      }
    };

    const fetchLikesAndPlaylists = async () => {
      try {
        const likesResponse = await fetch(`http://localhost:8000/api/users/${user.user_id}/likes/`);
        if (!likesResponse.ok) {
          throw new Error(`Failed to fetch liked songs: ${likesResponse.status}`);
        }
        const likesData = await likesResponse.json();
        const likedStatus = Array.isArray(likesData)
          ? likesData.reduce((obj, song) => {
              obj[song.song_id] = true;
              return obj;
            }, {})
          : {};
        setLikedSongs(likedStatus);

        const playlistsResponse = await fetch(`http://localhost:8000/api/users/${user.user_id}/playlists/`);
        if (!playlistsResponse.ok) {
          throw new Error(`Failed to fetch playlists: ${playlistsResponse.status}`);
        }
        const playlistsData = await playlistsResponse.json();
        setPlaylists(Array.isArray(playlistsData) ? playlistsData : []);
      } catch (error) {
        console.error("Error fetching likes or playlists:", error);
      }
    };

    Promise.all([fetchPlaylistData(), fetchSuggestedSongs(), fetchLikesAndPlaylists()]).finally(() =>
      setLoading(false)
    );
  }, [user, playlist_number, navigate]);

  // Handle song added to playlist event
  useEffect(() => {
    const handleSongAddedToPlaylist = (event) => {
      const { playlistId, song } = event.detail || {};
      if (playlistId === parseInt(playlist_number) && song) {
        setPlaylistSongs((prev) => {
          // Prevent duplicates
          if (prev.some((s) => s.song_id === song.song_id)) {
            console.log(`Song ${song.title} already in playlist ${playlistId}`);
            return prev;
          }
          return [...prev, song];
        });
      }
    };
    window.addEventListener("songAddedToPlaylist", handleSongAddedToPlaylist);
    return () => window.removeEventListener("songAddedToPlaylist", handleSongAddedToPlaylist);
  }, [playlist_number]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(Number(seconds) / 60);
    const secondsLeft = Math.floor(Number(seconds) % 60);
    return `${minutes}:${secondsLeft.toString().padStart(2, "0")}`;
  };

  const handlePlaySong = (song) => {
    const formattedSong = formatSong(song);
    playSong(formattedSong);
    if (user) {
      fetch(`/api/users/${user.user_id}/listening_history/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: song.song_id }),
      }).catch((error) => console.error("Error updating history:", error));
    }
  };

  const toggleLike = (songId, event) => {
    event.stopPropagation();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const newLiked = !likedSongs[songId];
    setLikedSongs((prev) => ({ ...prev, [songId]: newLiked }));
    fetch(`/api/users/${user.user_id}/likes/`, {
      method: newLiked ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_id: songId }),
    }).catch((error) => {
      console.error("Error updating like:", error);
      setLikedSongs((prev) => ({ ...prev, [songId]: !newLiked }));
    });
  };

  const handleAddToQueue = useCallback(
    (song, event) => {
      event.stopPropagation();
      if (!song?.song_id) return;
      const formattedSong = formatSong(song);
      if (addToQueue) {
        addToQueue(formattedSong);
      } else {
        updateQueue((queue) => {
          if (queue.some((item) => item.song_id === formattedSong.song_id)) {
            return queue; // Tránh trùng lặp
          }
          return [...queue, formattedSong];
        });
      }
    },
    [addToQueue, formatSong, updateQueue],
  );

  const handlePlayNext = useCallback(
    (song, event) => {
      event.stopPropagation();
      if (!song?.song_id) return;
      const formattedSong = formatSong(song);
      if (playNext) {
        playNext(formattedSong);
      } else {
        updateQueue((queue) => {
          if (queue.some((item) => item.song_id === formattedSong.song_id)) {
            return queue; // Tránh trùng lặp
          }
          const index = queue.findIndex((item) => item.song_id === currentSong?.song_id);
          return index !== -1
            ? [...queue.slice(0, index + 1), formattedSong, ...queue.slice(index + 1)]
            : [formattedSong, ...queue];
        });
      }
    },
    [playNext, currentSong, formatSong, updateQueue],
  );

  const addToPlaylist = (song, targetPlaylistNumber, event) => {
    event.stopPropagation();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const targetPlaylist = playlists.find((p) => p.playlist_number === parseInt(targetPlaylistNumber));
    if (!targetPlaylist) {
      console.error("Target playlist not found");
      return;
    }
    fetch(`/api/users/${user.user_id}/playlists/${targetPlaylistNumber}/songs/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_id: song.song_id }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to add song");
        return response.json();
      })
      .then(() => {
        if (targetPlaylistNumber.toString() === playlist_number) {
          const formattedSong = {
            song_id: song.song_id,
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            album: song.album,
            image: song.image,
          };
          setPlaylistSongs((prev) => {
            // Prevent duplicates
            if (prev.some((s) => s.song_id === song.song_id)) {
              console.log(`Song ${song.title} already in playlist ${playlist_number}`);
              return prev;
            }
            return [...prev, formattedSong];
          });
          // Dispatch event to notify other components
          window.dispatchEvent(
            new CustomEvent("songAddedToPlaylist", {
              detail: { playlistId: parseInt(playlist_number), song: formattedSong },
            })
          );
        }
      })
      .catch((error) => console.error("Error adding to playlist:", error));
  };

  const createNewPlaylist = (song, event) => {
    event.stopPropagation();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    fetch(`/api/users/${user.user_id}/playlists/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playlist_name: `Playlist ${playlists.length + 1}`,
        is_public: false,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to create playlist");
        return response.json();
      })
      .then((newPlaylist) => {
        fetch(`/api/users/${user.user_id}/playlists/${newPlaylist.playlist_number}/songs/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_id: song.song_id }),
        })
          .then((response) => {
            if (!response.ok) throw new Error("Failed to add song to new playlist");
            setPlaylists((prev) => [...prev, newPlaylist]);
            window.dispatchEvent(new Event("playlistsChanged")); // Notify Sidebar
          })
          .catch((error) => console.error("Error adding song to new playlist:", error));
      })
      .catch((error) => console.error("Error creating playlist:", error));
  };

  const handleLoginRedirect = () => {
    navigate("/login");
    setShowLoginModal(false);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    navigate("/main");
  };

  const totalMinutes = playlistSongs.reduce((sum, song) => {
    const [minutes, seconds] = song.duration.split(":").map(Number);
    return sum + minutes * 60 + seconds;
  }, 0);
  const songCount = playlistSongs.length;

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div className="playlist-detail-container">
      <div>Error: {error}</div>
      <button onClick={() => navigate("/main")} style={{ marginTop: "1rem" }}>
        Back to main
      </button>
    </div>
  );

  return (
    <div className="playlist-detail-container">
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeLoginModal}
        onLoginRedirect={handleLoginRedirect}
      />
      {!showLoginModal && (
        <div className="playlist-detail-header">
          <div className="playlist-detail-cover-container">
            <div className="playlist-detail-cover">
              <img
                src={playlist?.image_url || "/placeholder.svg?height=360&width=360"}
                alt="Playlist cover"
                className="cover-image"
              />
              <div className="play-button-overlay" onClick={() => playlistSongs[0] && handlePlaySong(playlistSongs[0])}>
                <Play size={40} />
              </div>
            </div>
            <div className="playlist-detail-creator">
              <div className="playlist-letter-container">
                <div className="playlist-detail-letter">
                  {playlist?.playlist_name || "Playlist"}
                </div>
              </div>
              <div className="creator-info">
                <div>Tạo bởi {user?.username || "User"}</div>
              </div>
              <button className="more-button">
                <MoreVertical size={24} />
              </button>
            </div>
          </div>

          <div className="playlist-detail-content">
            <div className="playlist-detail-info">
              <div>
                <h1 className="playlist-detail-title">{playlist?.playlist_name || "Playlist"}</h1>
                <p className="playlist-detail-subtitle">Playlist của bạn</p>
              </div>
            </div>

            {songCount === 0 && (
              <div className="empty-state-modal">
                <div className="music-note-icon">
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <p className="empty-state-text">Không có bài hát trong playlist của bạn</p>
                <button onClick={() => navigate("/main/songs")}>Add songs</button>
              </div>
            )}

            {songCount > 0 && (
              <div className="songs-container">
                <div className="song-list-header">
                  <div className="song-number">
                    <span>#</span>
                  </div>
                  <div className="song-title-header">
                    <span>BÀI HÁT</span>
                  </div>
                  <div className="song-album-header">
                    <span>ALBUM</span>
                  </div>
                  <div className="song-duration-header">
                    <span>THỜI GIAN</span>
                  </div>
                </div>

                <div className="songs-list">
                  {playlistSongs.map((song, index) => (
                    <div
                      className={`song-item ${currentSong?.song_id === song.song_id ? "playing" : ""}`}
                      key={song.song_id}
                      onClick={() => handlePlaySong(song)}
                      onMouseEnter={() => setHoveredSong(song.song_id)}
                      onMouseLeave={() => setHoveredSong(null)}
                    >
                      <div className="song-drag-handle">
                        <div className="song-number-display">{index + 1}</div>
                        <List size={16} className="drag-icon" />
                      </div>
                      <div className="song-title-container">
                        <img src={song.image} alt={song.title} className="song-image" />
                        <div className="song-info">
                          <div className="song-title">{song.title}</div>
                          <div className="song-artist">{song.artist}</div>
                        </div>
                      </div>
                      <div className="song-album">{song.album}</div>
                      {hoveredSong === song.song_id && (
                        <SongActions
                          song={song}
                          isLiked={likedSongs[song.song_id]}
                          toggleLike={toggleLike}
                          addToQueue={handleAddToQueue}
                          playNext={handlePlayNext}
                          playlists={playlists}
                          addToPlaylist={addToPlaylist}
                          createNewPlaylist={createNewPlaylist}
                        />
                      )}
                      <div className="song-duration">{song.duration}</div>
                    </div>
                  ))}
                </div>

                <div className="playlist-detail-footer">
                  <span>
                    {songCount} bài hát • {Math.floor(totalMinutes / 60)} phút
                  </span>
                </div>
              </div>
            )}

            <div className="suggested-songs-section">
              <div className="playlist-detail-info">
                <div>
                  <h2 className="playlist-detail-title">Bài Hát Gợi Ý</h2>
                  <p className="playlist-detail-subtitle">Dựa trên tiêu đề của playlist này</p>
                </div>
                <button
                  className="refresh-button"
                  onClick={() => {
                    setSuggestedSongs([]);
                    const fetchSuggestedSongs = async () => {
                      try {
                        const response = await fetch("/api/songs/random/?limit=6");
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        const data = await response.json();
                        const formattedSongs = data.map((song) => ({
                          song_id: song.song_id,
                          title: song.title || "Unknown Title",
                          artist: song.artist_name || "Unknown Artist",
                          duration: formatDuration(song.duration || 0),
                          album: song.album_title || "",
                          image: song.image_url || "/placeholder.svg?height=60&width=60",
                        }));
                        setSuggestedSongs(formattedSongs);
                      } catch (err) {
                        setError(err.message);
                      }
                    };
                    fetchSuggestedSongs();
                  }}
                >
                  <RefreshCw size={16} />
                  <span>LÀM MỚI</span>
                </button>
              </div>

              <div className="songs-list suggested-songs-list">
                {suggestedSongs.map((song) => (
                  <div
                    className="song-item"
                    key={song.song_id}
                    onClick={() => handlePlaySong(song)}
                    onMouseEnter={() => setHoveredSong(`suggested-${song.song_id}`)}
                    onMouseLeave={() => setHoveredSong(null)}
                  >
                    <div className="song-note-icon">
                      <Music size={16} />
                    </div>
                    <div className="song-title-container">
                      <img src={song.image} alt={song.title} className="song-image" />
                      <div className="song-info">
                        <div className="song-title">{song.title}</div>
                        <div className="song-artist">{song.artist}</div>
                      </div>
                    </div>
                    <div className="song-album">{song.album}</div>
                    {hoveredSong === `suggested-${song.song_id}` && (
                      <SongActions
                        song={song}
                        isLiked={likedSongs[song.song_id]}
                        toggleLike={toggleLike}
                        addToQueue={handleAddToQueue}
                        playNext={handlePlayNext}
                        playlists={playlists}
                        addToPlaylist={addToPlaylist}
                        createNewPlaylist={createNewPlaylist}
                      />
                    )}
                    <div className="song-duration">{song.duration}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistDetail;