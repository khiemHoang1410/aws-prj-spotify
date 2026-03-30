import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, Save, X, Music, BadgeCheck } from 'lucide-react';
import { showToast } from '../store/uiSlice';
import { updateProfile } from '../services/UserService';
import { ROLES, VERIFY_STATUS } from '../constants/enums';
import CardSong from '../components/cards/CardSong';
import { setCurrentSong } from '../store/playerSlice';
import { getHistory } from '../services/HistoryService';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, likedSongs, verifyStatus } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [playHistory, setPlayHistory] = useState([]);

  useEffect(() => {
    setPlayHistory(getHistory().slice(0, 10));
  }, []);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    const result = await updateProfile({ displayName: displayName.trim() });
    if (result?.success) {
      dispatch(showToast({ message: 'Cập nhật thành công!', type: 'success' }));
      setIsEditing(false);
    } else {
      dispatch(showToast({ message: 'Không thể cập nhật. Thử lại sau.', type: 'error' }));
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setDisplayName(user?.name || user?.username || '');
    setIsEditing(false);
  };

  const handlePlayLiked = (song) => {
    dispatch(setCurrentSong(song));
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="flex items-end gap-6 mb-8 pb-8 border-b border-neutral-800">
        <div className="relative">
          <img
            src={user.avatar_url || 'https://i.pravatar.cc/150?img=1'}
            alt={user.username}
            className="w-28 h-28 rounded-full object-cover shadow-2xl"
          />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center border-2 border-[#121212]">
            <User size={14} className="text-neutral-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Hồ sơ</p>
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                className="bg-neutral-700 text-white text-3xl font-extrabold rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-green-500 max-w-xs"
              />
              <button
                onClick={handleSave}
                disabled={isSaving || !displayName.trim()}
                className="p-2 bg-green-500 text-black rounded-full hover:bg-green-400 transition disabled:opacity-50"
              >
                <Save size={16} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-extrabold text-white truncate">{displayName}</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-full transition"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <span>{user.email}</span>
            {user.role === ROLES.ARTIST && (
              <span className="flex items-center gap-1 text-blue-400 font-semibold">
                <BadgeCheck size={14} /> Nghệ sĩ
              </span>
            )}
            {user.role === ROLES.ADMIN && (
              <span className="text-red-400 font-semibold">Admin</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{likedSongs.length}</p>
          <p className="text-xs text-neutral-400 mt-1">Bài hát đã thích</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">3</p>
          <p className="text-xs text-neutral-400 mt-1">Playlist</p>
        </div>
        <div className="bg-neutral-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-white capitalize">{user.role}</p>
          <p className="text-xs text-neutral-400 mt-1">Vai trò</p>
        </div>
      </div>

      {/* Artist section */}
      {user.role === ROLES.ARTIST && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Công cụ nghệ sĩ</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/upload')}
              className="bg-neutral-800 hover:bg-neutral-700 rounded-xl p-4 flex items-center gap-4 transition text-left"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Music size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Upload nhạc</p>
                <p className="text-xs text-neutral-400">Thêm bài hát mới</p>
              </div>
            </button>
            <div className="bg-neutral-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <BadgeCheck size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Trạng thái xác minh</p>
                <p className={`text-xs mt-0.5 ${verifyStatus === VERIFY_STATUS.APPROVED ? 'text-green-400' : verifyStatus === VERIFY_STATUS.PENDING ? 'text-yellow-400' : 'text-neutral-400'}`}>
                  {verifyStatus === VERIFY_STATUS.APPROVED ? 'Đã xác minh' : verifyStatus === VERIFY_STATUS.PENDING ? 'Đang chờ duyệt' : 'Chưa xác minh'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liked songs */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Bài hát đã thích</h2>
        {likedSongs.length === 0 ? (
          <p className="text-neutral-400 text-sm">Bạn chưa thích bài hát nào.</p>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {likedSongs.map((song) => (
              <CardSong key={song.song_id} song={song} onPlay={handlePlayLiked} />
            ))}
          </div>
        )}
      </div>
      {/* Lịch sử nghe nhạc */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Lịch sử nghe nhạc</h2>
        {playHistory.length === 0 ? (
          <p className="text-neutral-400 text-sm">Бạn chưa nghe bài hát nào gần đây.</p>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {playHistory.map((song) => (
              <CardSong key={`${song.song_id}-${song.played_at}`} song={song} onPlay={handlePlayLiked} />
            ))}
          </div>
        )}
      </div>    </div>
  );
}
