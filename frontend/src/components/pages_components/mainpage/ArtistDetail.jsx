"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Play, CheckCircle } from "lucide-react";
import SongActions from "../ui/SongActions";
import { SongHistoryService } from "../utils/SongHistoryService";
import { FavoriteService } from "../utils/FavoriteService";

function ArtistDetail({ onBack, playSong, currentSong, addToQueue, playNext }) {
  const { artistId } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedSongs, setLikedSongs] = useState({});
  const [selectedSongs, setSelectedSongs] = useState({});
  const [playlists, setPlaylists] = useState([]);
  const [hoveredSong, setHoveredSong] = useState(null);

  // Hàm chuẩn hóa định dạng bài hát
  const formatSong = useCallback(
    (song) => ({
      song_id: song.song_id,
      title: song.title || "Unknown Title",
      artist: {
        artist_name: artist?.artist_name || "Unknown Artist",
        artist_id: artist?.artist_id,
      },
      duration: song.duration || 0,
      image_url: song.image_url || artist?.image_url || "/placeholder.svg",
      audio_url: song.audio_url || `/api/songs/${song.song_id}/stream/`,
      isPlaying: true,
    }),
    [artist],
  );

  // Hàm cập nhật queue trong localStorage
  const updateQueue = useCallback((updateFn) => {
    const queue = JSON.parse(localStorage.getItem("playingQueue") || "[]");
    const updatedQueue = updateFn(queue);
    localStorage.setItem("playingQueue", JSON.stringify(updatedQueue));
  }, []);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await fetch(`/api/artists/${artistId}/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const formattedArtist = {
          artist_id: data.artist_id,
          artist_name: data.artist_name || "Unknown Artist",
          image_url: data.image_url || "/placeholder.svg?height=300&width=1200",
          monthly_listeners: data.monthly_listeners || 0,
          bio: data.bio || "",
          popular_songs: data.popular_songs.map((song) => ({
            song_id: song.song_id,
            title: song.title || "Unknown Title",
            duration: song.duration || 0,
            image_url: song.image_url || data.image_url || "/placeholder.svg?height=40&width=40",
            audio_url: `/api/songs/${song.song_id}/stream/`,
            listeners: song.listeners || 0,
          })),
        };
        setArtist(formattedArtist);

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const response = await fetch(`/api/users/${userData.user_id}/likes/`);
          const likedData = await response.json();
          const likedArray = Array.isArray(likedData) ? likedData : [];
          const likedStatus = Object.fromEntries(
            formattedArtist.popular_songs.map((song) => [
              song.song_id,
              likedArray.some((likedSong) => likedSong.song_id === song.song_id),
            ]),
          );
          setLikedSongs(likedStatus);
          Object.entries(likedStatus).forEach(([songId, isLiked]) => {
            localStorage.setItem(`liked_${songId}`, isLiked.toString());
          });
        } else {
          const likedStatus = Object.fromEntries(
            formattedArtist.popular_songs.map((song) => [
              song.song_id,
              localStorage.getItem(`liked_${song.song_id}`) === "true",
            ]),
          );
          setLikedSongs(likedStatus);
        }
      } catch (error) {
        console.error("Error fetching artist:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
    setPlaylists(JSON.parse(localStorage.getItem("playlists") || "[]"));

    const handleSongLikeChanged = () => {
      const updatedLikedSongs = Object.fromEntries(
        artist?.popular_songs.map((song) => [song.song_id, localStorage.getItem(`liked_${song.song_id}`) === "true"]) ||
          [],
      );
      setLikedSongs(updatedLikedSongs);
    };

    window.addEventListener("songLikeChanged", handleSongLikeChanged);
    return () => window.removeEventListener("songLikeChanged", handleSongLikeChanged);
  }, [artistId, artist?.popular_songs]);

  const handlePlaySong = useCallback(
    (song) => {
      if (!song?.song_id) return;
      const formattedSong = formatSong(song);
      playSong(formattedSong);

      const today = new Date().toISOString().split("T")[0];
      const existingHistory = SongHistoryService.getHistory();
      const existingSong = existingHistory.find((s) => s.song_id === song.song_id);
      const dailyPlays = existingSong?.dailyPlays || {};
      dailyPlays[today] = (dailyPlays[today] || 0) + 1;

      SongHistoryService.addToHistory({
        ...formattedSong,
        lastPlayed: new Date().toISOString(),
        playCount: (existingSong?.playCount || 0) + 1,
        dailyPlays: dailyPlays,
        playDate: today,
      });

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        fetch(`/api/users/${userData.user_id}/listening_history/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: userData.user_id,
            song: song.song_id,
            date: today,
            play_count: dailyPlays[today],
          }),
        }).catch((error) => console.error("Error saving to listening history:", error));
      }
    },
    [formatSong, playSong],
  );

  const toggleLike = useCallback(
    (songId, event) => {
      event.stopPropagation();
      const song = artist.popular_songs.find((s) => s.song_id === songId);
      if (!song) {
        console.error("Song not found:", songId);
        return;
      }
      const songData = formatSong(song);
      const newLiked = !likedSongs[songId];
      setLikedSongs((prev) => ({ ...prev, [songId]: newLiked }));
      FavoriteService.toggleFavorite(songData);
      FavoriteService.syncWithBackend(songId, newLiked).catch((error) => {
        console.error("Error updating like in DB:", error);
        setLikedSongs((prev) => ({ ...prev, [songId]: !newLiked }));
        FavoriteService.toggleFavorite(songData);
      });
    },
    [artist, likedSongs, formatSong],
  );

  const handleSelectSong = (songId, event) => {
    event.stopPropagation();
    setSelectedSongs((prev) => ({ ...prev, [songId]: !prev[songId] }));
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

  const addToPlaylist = useCallback(
    (song, playlistId, event) => {
      event.stopPropagation();
      const formattedSong = formatSong(song);
      fetch(`/api/playlists/${playlistId}/songs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: song.song_id }),
      })
        .then((response) => response.json())
        .then(() => {
          setPlaylists((prev) => {
            const updated = prev.map((p) =>
              p.id === playlistId && !p.songs.some((s) => s.song_id === song.song_id)
                ? { ...p, songs: [...p.songs, formattedSong] }
                : p,
            );
            localStorage.setItem("playlists", JSON.stringify(updated));
            return updated;
          });
        })
        .catch((error) => console.error("Error adding to playlist:", error));
    },
    [formatSong],
  );

  const createNewPlaylist = useCallback(
    (song, event) => {
      event.stopPropagation();
      const userId = localStorage.getItem("user_id");
      const formattedSong = formatSong(song);
      fetch(`/api/playlists/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userId,
          playlist_name: `Playlist ${playlists.length + 1}`,
          playlist_type: "user",
          is_public: false,
        }),
      })
        .then((response) => response.json())
        .then((newPlaylist) => {
          fetch(`/api/playlists/${newPlaylist.playlist_id}/songs/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song_id: song.song_id }),
          }).then(() => {
            setPlaylists((prev) => {
              const updated = [...prev, { ...newPlaylist, songs: [formattedSong] }];
              localStorage.setItem("playlists", JSON.stringify(updated));
              return updated;
            });
          });
        })
        .catch((error) => console.error("Error creating playlist:", error));
    },
    [formatSong, playlists.length],
  );

  const formatDuration = (duration) => {
    if (!duration) return "0:00";
    if (typeof duration === "string" && duration.includes(":")) return duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="artist-detail-loading">Đang tải...</div>;
  if (error) return <div className="artist-detail-error">Lỗi: {error}</div>;
  if (!artist) return <div className="artist-detail-error">Không tìm thấy nghệ sĩ</div>;

  return (
    <div className="artist-detail-container">
      <div className="artist-detail-cover">
        <img
          src={artist.image_url || "/placeholder.svg"}
          alt={`${artist.artist_name} cover`}
          className="artist-detail-cover-image"
        />
      </div>

      <div className="artist-detail-info">
        <span className="artist-detail-verified">
          <CheckCircle size={16} className="verified-icon" /> Nghệ sĩ được xác minh
        </span>
        <h1 className="artist-detail-name">{artist.artist_name}</h1>
        <p className="artist-detail-listeners">{artist.monthly_listeners.toLocaleString()} người nghe hàng tháng</p>
      </div>

      <div className="artist-detail-songs">
        <h2 className="artist-detail-section-title">Phổ biến</h2>
        {artist.popular_songs?.length > 0 ? (
          <div className="songs-list">
            {artist.popular_songs.map((song, index) => (
              <div
                key={song.song_id}
                className={`song-item ${currentSong?.song_id === song.song_id ? "playing" : ""}`}
                onClick={() => handlePlaySong(song)}
                onMouseEnter={() => setHoveredSong(song.song_id)}
                onMouseLeave={() => setHoveredSong(null)}
              >
                <div className="song-index" onClick={(e) => handleSelectSong(song.song_id, e)}>
                  <span className="song-index-number">{index + 1}</span>
                  <div className={`song-index-checkbox ${selectedSongs[song.song_id] ? "checked" : ""}`}></div>
                </div>

                <div className="song-cover">
                  <img src={song.image_url || "/placeholder.svg"} alt={`${song.title} cover`} />
                  <div className="song-cover-overlay">
                    <Play size={16} fill="white" />
                  </div>
                </div>

                <div className="song-info">
                  <h3 className="song-title">{song.title}</h3>
                  <p className="song-artist">{artist.artist_name}</p>
                </div>

                <span className="song-listeners">{song.listeners.toLocaleString()}</span>

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

                <span className="song-duration">{formatDuration(song.duration)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-songs">Không có bài hát phổ biến nào.</p>
        )}
      </div>

      <button className="see-more-button">Xem thêm</button>

      {artist.bio && (
        <div className="artist-detail-bio">
          <h2 className="artist-detail-section-title">Giới thiệu</h2>
          <p>{artist.bio}</p>
        </div>
      )}
    </div>
  );
}

export default ArtistDetail;