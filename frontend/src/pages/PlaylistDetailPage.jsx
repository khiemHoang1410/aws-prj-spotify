import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Play, Shuffle, Clock, Music, Search, Globe, Lock, Edit3 } from 'lucide-react';
import { setCurrentSong, clearQueue, addToQueue, playNextSong, setShuffleMode } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import {
  selectPlaylistById,
  selectPlaylistSongs,
  selectPlaylistCover,
  selectIsReordering,
  fetchPlaylistSongs,
  removeSong,
  reorderSongs,
} from '../store/playlistSlice';
import { reorderArray } from '../store/playlistUtils';
import PlaylistSongRow from '../components/playlists/PlaylistSongRow';
import AddSongPanel from '../components/playlists/AddSongPanel';
import PlaylistRenameModal from '../components/playlists/PlaylistRenameModal';
import PlaylistDeleteConfirm from '../components/playlists/PlaylistDeleteConfirm';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';

const PLAYLIST_DEFAULT_IMG = '/pictures/playlistDefault.jpg';
const VIRTUAL_THRESHOLD = 100;

export default function PlaylistDetailPage() {
  const dispatch = useDispatch();
  const { id: playlistId } = useParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const playlist = useSelector((state) => selectPlaylistById(state, playlistId));
  const songs = useSelector((state) => selectPlaylistSongs(state, playlistId));
  const cover = useSelector((state) => selectPlaylistCover(state, playlistId));
  const isReordering = useSelector(selectIsReordering);

  const [isAddingSongs, setIsAddingSongs] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const parentRef = useRef(null);

  const isOwner = isAuthenticated && user?.user_id && playlist?.userId === user.user_id;

  // Fetch songs on mount if not already loaded
  useEffect(() => {
    if (!playlistId) return;
    if (songs.length === 0) {
      setIsLoading(true);
      dispatch(fetchPlaylistSongs(playlistId)).finally(() => setIsLoading(false));
    }
  }, [playlistId, dispatch]);

  // Virtual scroll setup (only when > VIRTUAL_THRESHOLD songs)
  const useVirtual = songs.length > VIRTUAL_THRESHOLD;
  const rowVirtualizer = useVirtualizer({
    count: useVirtual ? songs.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    enabled: useVirtual,
  });

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  const handlePlayAll = () => {
    if (!songs.length) return;
    handlePlaySong(songs[0]);
  };

  const handleShuffle = () => {
    if (!songs.length) return;
    if (!isShuffleActive) {
      dispatch(clearQueue());
      const shuffled = [...songs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      shuffled.forEach((s) => dispatch(addToQueue(s)));
      dispatch(setShuffleMode(true));
      dispatch(playNextSong());
      setIsShuffleActive(true);
    } else {
      dispatch(setShuffleMode(false));
      setIsShuffleActive(false);
    }
  };

  // Stable onRemove reference for React.memo
  const handleRemove = useCallback((songId) => {
    dispatch(removeSong({ playlistId, songId }));
  }, [dispatch, playlistId]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    if (isReordering) return;

    const newSongs = reorderArray(songs, result.source.index, result.destination.index);
    dispatch(reorderSongs({ playlistId, newSongs }));
  };

  if (isLoading && songs.length === 0) {
    return (
      <div className="space-y-3 mt-4">
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
      </div>
    );
  }

  // Fallback: if playlist not in Redux (e.g. public playlist not owned by user)
  const displayName = playlist?.name || 'Playlist';
  const displayCover = cover || playlist?.image_url || PLAYLIST_DEFAULT_IMG;
  const displayOwner = playlist?.owner || 'Bạn';
  const isPublic = playlist?.is_public ?? false;

  return (
    <div>
      {/* Gradient header */}
      <div className="flex items-end gap-6 h-64 pb-6 bg-gradient-to-b from-purple-800/60 to-transparent mb-6 -mx-6 -mt-6 px-6">
        <div className="relative group flex-shrink-0">
          <img
            src={displayCover}
            alt={displayName}
            className="w-44 h-44 rounded-md shadow-2xl object-cover"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLAYLIST_DEFAULT_IMG; }}
          />
          {isOwner && (
            <button
              onClick={() => setIsRenameOpen(true)}
              className="absolute inset-0 rounded-md bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              <Edit3 size={24} className="text-white" />
            </button>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white uppercase mb-1">Danh sách phát</p>
          <h1
            className={`text-4xl font-extrabold text-white truncate mb-2 ${isOwner ? 'cursor-pointer hover:underline' : ''}`}
            onClick={isOwner ? () => setIsRenameOpen(true) : undefined}
          >
            {displayName}
          </h1>
          <p className="text-sm text-neutral-300">
            {displayOwner} • {songs.length} bài hát •{' '}
            {isPublic
              ? <span className="inline-flex items-center gap-1"><Globe size={12} /> Công khai</span>
              : <span className="inline-flex items-center gap-1"><Lock size={12} /> Riêng tư</span>
            }
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayAll}
          disabled={!songs.length}
          className={`w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg ${
            songs.length ? 'hover:bg-green-400 hover:scale-105 transition' : 'bg-green-500/50 cursor-not-allowed'
          }`}
        >
          <Play size={24} className="text-black fill-black ml-1" />
        </button>

        <button
          onClick={handleShuffle}
          disabled={!songs.length}
          className={`transition relative ${
            !songs.length
              ? 'text-neutral-400 opacity-50 cursor-not-allowed'
              : isShuffleActive
                ? 'text-green-500 hover:text-green-400'
                : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Shuffle size={24} />
          {isShuffleActive && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
          )}
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setIsAddingSongs((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                isAddingSongs
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'border border-neutral-600 text-neutral-300 hover:border-white hover:text-white'
              }`}
            >
              <Search size={16} />
              Tìm bài hát để thêm vào
            </button>

            <button
              onClick={() => setIsDeleteOpen(true)}
              className="ml-auto px-4 py-2 rounded-full text-sm font-semibold border border-neutral-600 text-neutral-300 hover:border-red-400 hover:text-red-400 transition"
            >
              Xóa playlist
            </button>
          </>
        )}
      </div>

      {/* Song table header */}
      {songs.length > 0 && (
        <div className="grid grid-cols-[32px_24px_1fr_1fr_56px_40px] gap-3 px-2 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
          <span />
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Nghệ sĩ</span>
          <span className="flex justify-center"><Clock size={14} /></span>
          <span />
        </div>
      )}

      {/* Song rows — DnD */}
      {songs.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`playlist-${playlistId}`} isDropDisabled={isReordering || !isOwner}>
            {(provided) => (
              useVirtual ? (
                <div
                  ref={(el) => {
                    provided.innerRef(el);
                    parentRef.current = el;
                  }}
                  {...provided.droppableProps}
                  className="overflow-auto"
                  style={{ height: Math.min(songs.length * 56, 600) }}
                >
                  <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const song = songs[virtualRow.index];
                      return (
                        <div
                          key={song.song_id}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          onClick={() => handlePlaySong(song)}
                        >
                          <PlaylistSongRow
                            song={song}
                            index={virtualRow.index}
                            onRemove={handleRemove}
                            isOwner={isOwner}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {provided.placeholder}
                </div>
              ) : (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex flex-col"
                >
                  {songs.map((song, idx) => (
                    <div key={song.song_id} onClick={() => handlePlaySong(song)}>
                      <PlaylistSongRow
                        song={song}
                        index={idx}
                        onRemove={handleRemove}
                        isOwner={isOwner}
                      />
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
              )
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="mt-10">
          <EmptyState icon={Music} title="Playlist trống" description="Playlist này chưa có bài hát nào." />
        </div>
      )}

      {/* Add song panel */}
      {isAddingSongs && isOwner && (
        <AddSongPanel playlistId={playlistId} currentSongs={songs} />
      )}

      {/* Modals */}
      {isRenameOpen && playlist && (
        <PlaylistRenameModal playlistId={playlistId} onClose={() => setIsRenameOpen(false)} />
      )}
      {isDeleteOpen && playlist && (
        <PlaylistDeleteConfirm playlistId={playlistId} onClose={() => setIsDeleteOpen(false)} />
      )}
    </div>
  );
}
