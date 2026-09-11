import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, Send, Trash2, LogIn, AlertCircle } from 'lucide-react';
import { getSongComments, addSongComment, deleteSongComment } from '../../services/SongService';
import { openModal } from '../../store/authSlice';
import { showToast } from '../../store/uiSlice';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?img=11';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CommentsSection({ songId }) {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch comments on mount or when songId changes
  useEffect(() => {
    let cancelled = false;
    if (!songId) return;

    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const data = await getSongComments(songId);
        if (!cancelled) {
          setComments(data);
        }
      } catch {
        if (!cancelled) {
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchComments();
    return () => {
      cancelled = true;
    };
  }, [songId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    if (trimmed.length > 500) {
      dispatch(showToast({ message: 'Bình luận không được vượt quá 500 ký tự', type: 'error' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const newComment = await addSongComment(songId, trimmed);
      setComments((prev) => [newComment, ...prev]);
      setContent('');
      dispatch(showToast({ message: 'Đã đăng bình luận thành công!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Không thể đăng bình luận, vui lòng thử lại', type: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;

    setDeletingId(commentId);
    try {
      await deleteSongComment(songId, commentId);
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
      dispatch(showToast({ message: 'Đã xóa bình luận', type: 'info' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi xóa bình luận', type: 'error' }));
    } finally {
      setDeletingId(null);
    }
  };

  const currentUserId = user?.user_id || user?.id;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle size={20} className="text-green-500" />
          Bình luận {!isLoading && `(${comments.length})`}
        </h3>
      </div>

      {/* Form bình luận hoặc thông báo đăng nhập */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex gap-4">
          <img
            src={user?.avatar_url || DEFAULT_AVATAR}
            alt={user?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-neutral-700"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
          />
          <div className="flex-1 space-y-2">
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ cảm nghĩ của bạn về bài hát này..."
                rows={3}
                maxLength={500}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none transition"
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-neutral-500">
                {content.length}/500
              </span>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                <span>Đăng</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-neutral-300">
              Đăng nhập để tham gia bình luận và tương tác cùng cộng đồng.
            </p>
          </div>
          <button
            onClick={() => dispatch(openModal('login'))}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-xs rounded-full hover:scale-105 transition flex-shrink-0 cursor-pointer"
          >
            <LogIn size={14} />
            Đăng nhập
          </button>
        </div>
      )}

      {/* Danh sách bình luận */}
      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-neutral-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-neutral-800 rounded w-28" />
                  <div className="h-3 bg-neutral-800 rounded w-full" />
                  <div className="h-3 bg-neutral-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 bg-neutral-900/40 rounded-xl border border-dashed border-neutral-800">
            <MessageCircle size={36} className="mx-auto text-neutral-600 mb-2" />
            <p className="text-neutral-400 font-medium text-sm">Chưa có bình luận nào</p>
            <p className="text-neutral-600 text-xs mt-1">Hãy là người đầu tiên chia sẻ cảm nghĩ về bài hát này!</p>
          </div>
        ) : (
          comments.map((item) => {
            const isOwner = currentUserId && (currentUserId === item.user_id);
            const canDelete = isOwner || isAdmin;
            const isDeleting = deletingId === item.comment_id;

            return (
              <div
                key={item.comment_id}
                className="flex gap-3.5 p-3 rounded-xl hover:bg-white/5 transition group border border-transparent hover:border-neutral-800"
              >
                <img
                  src={item.user_avatar || DEFAULT_AVATAR}
                  alt={item.user_name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5 border border-neutral-800"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {item.user_name}
                      </span>
                      {item.created_at && (
                        <span className="text-xs text-neutral-500">
                          • {formatRelativeTime(item.created_at)}
                        </span>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(item.comment_id)}
                        disabled={isDeleting}
                        title="Xóa bình luận"
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 p-1 rounded transition disabled:opacity-50 cursor-pointer"
                      >
                        {isDeleting ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-neutral-200 mt-1 whitespace-pre-line leading-relaxed break-words">
                    {item.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
