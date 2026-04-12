import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2 } from 'lucide-react';
import DragHandle from './DragHandle';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const areEqual = (prev, next) =>
  prev.song.song_id === next.song.song_id &&
  prev.index === next.index &&
  prev.isDragging === next.isDragging;

const PlaylistSongRow = React.memo(({ song, index, onRemove, isOwner }) => {
  return (
    <Draggable draggableId={song.song_id} index={index} isDragDisabled={!isOwner}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`grid grid-cols-[32px_24px_1fr_1fr_56px_40px] gap-3 px-2 py-2 rounded-md transition group ${
            snapshot.isDragging
              ? 'bg-white/10 shadow-lg'
              : 'hover:bg-white/5'
          }`}
        >
          {isOwner
            ? <DragHandle dragHandleProps={provided.dragHandleProps} />
            : <div className="w-8" />
          }
          <span className="text-sm text-neutral-400 flex items-center group-hover:hidden">{index + 1}</span>
          <div className="flex items-center gap-3 min-w-0 col-start-3">
            <img
              src={song.image_url || IMG_FALLBACK}
              alt={song.title}
              className="w-10 h-10 rounded object-cover flex-shrink-0"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
            />
            <span className="text-sm font-medium text-white truncate">{song.title}</span>
          </div>
          <span className="text-sm text-neutral-400 flex items-center truncate">{song.artist_name}</span>
          <span className="text-sm text-neutral-400 flex items-center justify-center">{formatDuration(song.duration)}</span>
          {isOwner && (
            <button
              onClick={() => onRemove(song.song_id)}
              className="flex items-center justify-center text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
              title="Xoá khỏi playlist"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
}, areEqual);

PlaylistSongRow.displayName = 'PlaylistSongRow';

export default PlaylistSongRow;
