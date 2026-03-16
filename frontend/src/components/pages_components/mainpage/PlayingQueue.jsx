"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MoreHorizontal, Music, Plus, PlaySquare, Trash2, ChevronRight, AlarmClock, Play } from 'lucide-react';
import SongItem from "../ui/SongItem";

function PlayingQueue({
  songs,
  currentSongId,
  isOpen,
  playSong,
  addToQueue,
  playNext,
  setQueue,
  handleNext,
  toggleTimerModal,
}) {
  const [queueSongs, setQueueSongs] = useState(songs || []);
  const [playlists, setPlaylists] = useState([]);
  const [draggedSongId, setDraggedSongId] = useState(null);
  const [expandedSongId, setExpandedSongId] = useState(null);
  const dragOverItemId = useRef(null);
  const prevQueueRef = useRef([]);
  const initializedRef = useRef(false);

  const isValidSong = useCallback((song) => {
    return (
      song &&
      song.song_id &&
      song.audio_url &&
      typeof song.title === "string" &&
      (song.artist?.artist_name || typeof song.artist === "string")
    );
  }, []);

  useEffect(() => {
    try {
      const storedPlaylists = localStorage.getItem("playlists");
      if (storedPlaylists) {
        setPlaylists(JSON.parse(storedPlaylists));
      }
    } catch (error) {
      console.error("Error parsing playlists:", error);
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;

    try {
      if (songs && songs.length > 0) {
        const validSongs = songs.filter(isValidSong);
        setQueueSongs(validSongs);
        prevQueueRef.current = validSongs;
        initializedRef.current = true;
        return;
      }

      const storedQueue = localStorage.getItem("playingQueue");
      if (storedQueue) {
        const parsedQueue = JSON.parse(storedQueue);
        const validQueue = parsedQueue.filter(isValidSong);
        if (validQueue.length > 0) {
          setQueueSongs(validQueue);
          prevQueueRef.current = validQueue;
          initializedRef.current = true;
        }
      }
    } catch (error) {
      console.error("Error initializing queue:", error);
    }
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;

    if (songs && songs.length > 0) {
      const validSongs = songs.filter(isValidSong);
      const songsChanged = JSON.stringify(validSongs) !== JSON.stringify(queueSongs);

      if (songsChanged) {
        setQueueSongs(validSongs);
        prevQueueRef.current = validSongs;
      }
    }
  }, [songs, isValidSong, queueSongs]);

  useEffect(() => {
    if (!initializedRef.current) return;

    if (queueSongs.length > 0) {
      localStorage.setItem("playingQueue", JSON.stringify(queueSongs));
    }
  }, [queueSongs]);

  const updateQueueInStorage = useCallback(
    (updatedQueue) => {
      const validQueue = updatedQueue.filter(isValidSong);
      setQueueSongs(validQueue);
      if (typeof setQueue === 'function') {
        setQueue(validQueue);
      }
      localStorage.setItem("playingQueue", JSON.stringify(validQueue));
      window.dispatchEvent(new Event("storage"));
    },
    [isValidSong, setQueue]
  );

  const handleSongClick = useCallback(
    (song) => {
      if (isValidSong(song) && playSong) {
        playSong({ ...song, isPlaying: true });
        const updatedQueue = queueSongs.map((s) =>
          s.song_id === song.song_id ? { ...s, isPlaying: true } : { ...s, isPlaying: false }
        );
        updateQueueInStorage(updatedQueue);
      }
    },
    [playSong, queueSongs, updateQueueInStorage, isValidSong]
  );

  const removeSongFromQueue = useCallback(
    (songId, event) => {
      event?.stopPropagation();
      const updatedQueue = queueSongs.filter((song) => song.song_id !== songId);
      updateQueueInStorage(updatedQueue);
      setExpandedSongId(null);

      if (currentSongId === songId) {
        if (updatedQueue.length > 0) {
          playSong({ ...updatedQueue[0], isPlaying: true });
        } else {
          setQueue([]);
        }
      }
    },
    [queueSongs, updateQueueInStorage, currentSongId, playSong, setQueue]
  );

  const handleAddToQueue = useCallback(
    (song, event) => {
      event?.stopPropagation();
      if (!isValidSong(song)) return;

      // Kiểm tra trùng lặp
      if (queueSongs.some((s) => s.song_id === song.song_id)) {
        console.log("Song already in queue:", song.song_id);
        return;
      }

      const updatedQueue = [...queueSongs, song]; // Thêm vào cuối
      updateQueueInStorage(updatedQueue);
    },
    [queueSongs, updateQueueInStorage, isValidSong]
  );

  const handlePlayNext = useCallback(
    (song, event) => {
      event?.stopPropagation();
      if (!isValidSong(song)) return;

      // Kiểm tra trùng lặp
      if (queueSongs.some((s) => s.song_id === song.song_id)) {
        console.log("Song already in queue:", song.song_id);
        return;
      }

      const currentIndex = queueSongs.findIndex((s) => s.song_id === currentSongId);
      const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queueSongs.length;
      const updatedQueue = [
        ...queueSongs.slice(0, insertIndex),
        song,
        ...queueSongs.slice(insertIndex)
      ];
      updateQueueInStorage(updatedQueue);
    },
    [queueSongs, currentSongId, updateQueueInStorage, isValidSong]
  );

  const addToPlaylist = useCallback(
    (song, playlistId, event) => {
      event?.stopPropagation();
      if (!isValidSong(song)) return;
      const userId = localStorage.getItem("user_id");
      fetch(`/api/users/${userId}/playlists/${playlistId}/songs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: song.song_id })
      })
        .then((response) => response.json())
        .then(() => {
          setPlaylists((prev) => {
            const updated = prev.map((p) =>
              p.user_playlist_id === playlistId && !p.songs.some((s) => s.song_id === song.song_id)
                ? { ...p, songs: [...p.songs, song] }
                : p
            );
            localStorage.setItem("playlists", JSON.stringify(updated));
            return updated;
          });
        })
        .catch((error) => console.error("Error adding to playlist:", error));
    },
    [isValidSong]
  );

  const createNewPlaylist = useCallback(
    (song, event) => {
      event?.stopPropagation();
      if (!isValidSong(song)) return;
      const userId = localStorage.getItem("user_id");
      fetch(`/api/users/${userId}/playlists/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userId,
          playlist_name: `Playlist ${playlists.length + 1}`,
          is_public: false
        })
      })
        .then((response) => response.json())
        .then((newPlaylist) => {
          fetch(`/api/users/${userId}/playlists/${newPlaylist.playlist_number}/songs/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ song_id: song.song_id })
          }).then(() => {
            setPlaylists((prev) => {
              const updated = [...prev, { ...newPlaylist, songs: [song] }];
              localStorage.setItem("playlists", JSON.stringify(updated));
              return updated;
            });
          });
        })
        .catch((error) => console.error("Error creating playlist:", error));
    },
    [playlists.length, isValidSong]
  );

  const handleDragStart = useCallback((e) => {
    const songId = e.currentTarget.dataset.songId;
    setDraggedSongId(songId);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging");
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.currentTarget.classList.remove("dragging");
    setDraggedSongId(null);
  }, []);

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const targetId = e.currentTarget.dataset.songId;
      if (targetId !== draggedSongId) {
        dragOverItemId.current = targetId;
        document.querySelectorAll(".queue-song-container").forEach((item) => {
          item.classList.remove("drag-over");
          if (item.dataset.songId === targetId) item.classList.add("drag-over");
        });
      }
    },
    [draggedSongId]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      document.querySelectorAll(".queue-song-container").forEach((item) => item.classList.remove("drag-over"));
      if (!draggedSongId || !dragOverItemId.current || draggedSongId === dragOverItemId.current) return;

      const draggedIndex = queueSongs.findIndex((song) => song.song_id === draggedSongId);
      const dropIndex = queueSongs.findIndex((song) => song.song_id === dragOverItemId.current);
      if (draggedIndex === -1 || dropIndex === -1) return;

      const newQueueSongs = [...queueSongs];
      const [draggedSong] = newQueueSongs.splice(draggedIndex, 1);
      newQueueSongs.splice(dropIndex, 0, draggedSong);
      updateQueueInStorage(newQueueSongs);
      dragOverItemId.current = null;
    },
    [queueSongs, draggedSongId, updateQueueInStorage]
  );

  const toggleExpandSong = useCallback((songId, e) => {
    e?.stopPropagation();
    setExpandedSongId((prev) => (prev === songId ? null : songId));
  }, []);

  const currentPlayingSong = queueSongs.find((song) => song.song_id === currentSongId);

  return (
    <div className={`playing-queue-container ${isOpen ? "open" : ""}`}>
      <div className="playing-queue-tabs">
        <button className="queue-tab active">Danh sách phát</button>
        <button className="queue-tab">Nghe gần đây</button>
        <button className="queue-tab-icon" onClick={toggleTimerModal}>
          <AlarmClock size={16} />
        </button>
        <button className="queue-tab-icon">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {currentPlayingSong && (
        <div className="now-playing-card">
          <div className="now-playing-thumbnail">
            <img src={currentPlayingSong.image_url || "/placeholder.svg"} alt={currentPlayingSong.title} />
            <div className="now-playing-overlay">
              <Play size={24} fill="white" />
            </div>
          </div>
          <div className="now-playing-info">
            <h3 className="now-playing-title">{currentPlayingSong.title}</h3>
            <p className="now-playing-artist">{currentPlayingSong.artist?.artist_name || "Unknown Artist"}</p>
          </div>
        </div>
      )}

      <div className="queue-section">
        <div className="queue-section-header">
          <h3 className="queue-section-title">Tiếp theo</h3>
          <p className="queue-section-subtitle">Từ hàng đợi</p>
        </div>

        <div className="playing-queue-songs">
          {queueSongs.length === 0 ? (
            <p>Không có bài hát trong danh sách phát.</p>
          ) : (
            queueSongs.map((song) => (
              <div
                key={song.song_id}
                className={`queue-song-container ${expandedSongId === song.song_id ? "expanded" : ""}`}
                data-song-id={song.song_id}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {expandedSongId === song.song_id ? (
                  <div className="song-expanded-menu">
                    <div className="song-expanded-header">
                      <div className="song-thumbnail">
                        <img src={song.image_url || "/placeholder.svg"} alt={song.title} />
                      </div>
                      <div className="song-info">
                        <h4 className="song-title">{song.title}</h4>
                        <p className="song-artist">{song.artist?.artist_name || "Unknown Artist"}</p>
                      </div>
                      <button className="song-more-button" onClick={(e) => toggleExpandSong(song.song_id, e)}>
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    <div className="song-menu-options">
                      <button className="song-menu-option" onClick={() => handleSongClick(song)}>
                        <PlaySquare size={18} />
                        <span>Phát ngay</span>
                      </button>
                      <button className="song-menu-option" onClick={(e) => handlePlayNext(song, e)}>
                        <Plus size={18} />
                        <span>Phát tiếp theo</span>
                      </button>
                      <button className="song-menu-option">
                        <Music size={18} />
                        <span>Thêm vào playlist</span>
                        <ChevronRight size={18} />
                      </button>
                      <button className="song-menu-option" onClick={(e) => removeSongFromQueue(song.song_id, e)}>
                        <Trash2 size={18} />
                        <span>Xóa khỏi danh sách phát</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <SongItem
                    key={song.song_id}
                    song={song}
                    currentSong={{
                      song_id: currentSongId,
                      isPlaying: currentSongId === song.song_id && song.isPlaying
                    }}
                    onPlay={handleSongClick}
                    addToQueue={handleAddToQueue}
                    playNext={handlePlayNext}
                    playlists={playlists}
                    addToPlaylist={addToPlaylist}
                    createNewPlaylist={createNewPlaylist}
                    isInQueue={true}
                    removeSongFromQueue={removeSongFromQueue}
                    isDraggable={true}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayingQueue;