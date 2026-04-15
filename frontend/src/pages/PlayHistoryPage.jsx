import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Trash2, Clock, History, X } from 'lucide-react';
import { setCurrentSong } from '../store/playerSlice';
import { deleteEntry, clearAllHistory, loadMoreHistory } from '../store/historySlice';
import { getSongById } from '../services/SongService';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

// ─── groupByDate utility ──────────────────────────────────────────────────────

export const groupByDate = (entries) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);

  const DAY_NAMES = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

  const getLabel = (dateStr) => {
    const d = new Date(dateStr);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day.getTime() === today.getTime()) return 'Hôm nay';
    if (day.getTime() === yesterday.getTime()) return 'Hôm qua';
    if (day >= weekAgo) return DAY_NAMES[day.getDay()];
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const groups = [];
  const seen = new Map();

  for (const entry of entries) {
    const label = getLabel(entry.played_at);
    if (!seen.has(label)) {
      seen.set(label, groups.length);
      groups.push({ label, entries: [] });
    }
    groups[seen.get(label)].entries.push(entry);
  }

  return groups;
};

// ─── Relative time ────────────────────────────────────────────────────────────

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-2 animate-pulse">
    <div className="w-10 h-10 rounded bg-neutral-800 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-neutral-800 rounded w-2/5" />
      <div className="h-3 bg-neutral-800 rounded w-1/4" />
    </div>
    <div className="h-3 bg-neutral-800 rounded w-16" />
  </div>
);

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

const ConfirmDialog = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div className="bg-[#282828] rounded-xl p-6 w-80 shadow-2xl">
      <h3 className="text-white font-bold text-lg mb-2">Xóa toàn bộ lịch sử?</h3>
      <p className="text-neutral-400 text-sm mb-6">Hành động này không thể hoàn tác. Toàn bộ lịch sử nghe nhạc sẽ bị xóa vĩnh viễn.</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition">Hủy</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-400 text-white font-semibold rounded-full transition">Xóa tất cả</button>
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlayHistoryPage() {
  const dispatch = useDispatch();
  const { entries, isLoading, hasMore } = useSelector((s) => s.history);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [showConfirm, setShowConfirm] = useState(false);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  // Infinite scroll
  const handleLoadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    dispatch(loadMoreHistory()).finally(() => { loadingMoreRef.current = false; });
  }, [dispatch, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) handleLoadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  const handlePlay = async (entry) => {
    try {
      const song = await getSongById(entry.songId);
      dispatch(setCurrentSong(song));
    } catch {
      // Fallback nếu fetch lỗi — play với metadata có sẵn (không có audio_url)
      dispatch(setCurrentSong({
        song_id: entry.songId,
        title: entry.title,
        artist_name: entry.artist_name,
        artist_id: entry.artist_id,
        image_url: entry.image_url,
        duration: entry.duration,
      }));
    }
  };

  const handleDelete = (e, entryId) => {
    e.stopPropagation();
    dispatch(deleteEntry(entryId));
  };

  const handleClearAll = () => {
    dispatch(clearAllHistory());
    setShowConfirm(false);
  };

  const groups = groupByDate(entries);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History size={28} className="text-white" />
          <h1 className="text-2xl font-bold text-white">Lịch sử nghe nhạc</h1>
        </div>
        {isAuthenticated && entries.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-red-400 border border-neutral-700 hover:border-red-400 rounded-full transition"
          >
            <Trash2 size={14} />
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && entries.length === 0 && (
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-center">
          <Clock size={48} className="text-neutral-600 mb-4" />
          <p className="text-white font-semibold text-lg mb-2">Chưa có lịch sử nghe nhạc</p>
          <p className="text-neutral-400 text-sm">Bắt đầu nghe nhạc để xem lịch sử tại đây.</p>
        </div>
      )}

      {/* Timeline grouped by date */}
      {groups.map(({ label, entries: groupEntries }) => (
        <div key={label} className="mb-6">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-4 mb-2">{label}</h2>
          <div className="flex flex-col">
            {groupEntries.map((entry, idx) => (
              <div
                key={entry.entryId || idx}
                className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition"
                onClick={() => handlePlay(entry)}
              >
                <div className="relative w-10 h-10 flex-shrink-0">
                  <img
                    src={entry.image_url || IMG_FALLBACK}
                    alt={entry.title}
                    className="w-full h-full rounded object-cover"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                  />
                  <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded">
                    <Play fill="white" size={14} className="ml-0.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{entry.title}</p>
                  <p className="text-xs text-neutral-400 truncate">{entry.artist_name}</p>
                </div>
                <span className="text-xs text-neutral-500 flex-shrink-0 mr-2">
                  {relativeTime(entry.played_at)}
                </span>
                {isAuthenticated && (
                  <button
                    onClick={(e) => handleDelete(e, entry.entryId)}
                    className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                    title="Xóa khỏi lịch sử"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more spinner */}
      {isLoading && entries.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* End of list */}
      {!hasMore && entries.length > 0 && (
        <p className="text-center text-xs text-neutral-600 py-4">Đã hiển thị toàn bộ lịch sử</p>
      )}

      {showConfirm && <ConfirmDialog onConfirm={handleClearAll} onCancel={() => setShowConfirm(false)} />}
    </div>
  );
}
