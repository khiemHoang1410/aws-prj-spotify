import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, Save, X, Music, BadgeCheck, Clock, Trash2, Camera } from 'lucide-react';
import { showToast } from '../store/uiSlice';
import api from '../services/apiClient';
import { updateProfile } from '../services/UserService';
import { getArtistById } from '../services/ArtistService';
import { uploadCoverImage } from '../services/UploadService';
import { ROLES, VERIFY_STATUS } from '../constants/enums';
import CardSong from '../components/cards/CardSong';
import { setCurrentSong } from '../store/playerSlice';
import { clearAllHistory } from '../store/historySlice';
import { setVerifyStatus, loginSuccess } from '../store/authSlice';
import { selectPlaylistIds } from '../store/playlistSlice';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, likedSongs, verifyStatus } = useSelector((state) => state.auth, shallowEqual);
  const historyEntries = useSelector(
    (state) => state.history?.entries?.slice(0, 10) ?? [],
    shallowEqual
  );
  const playlistIds = useSelector(selectPlaylistIds);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [artistProfile, setArtistProfile] = useState(null);
  const avatarInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const { url } = await uploadCoverImage(file);
      const result = await updateProfile({ avatarUrl: url });
      if (result && !result.success && result.error) throw new Error(result.error);
      dispatch(loginSuccess({ ...user, avatar_url: url }));
      dispatch(showToast({ message: 'Cập nhật ảnh đại diện thành công', type: 'success' }));
    } catch (err) {
      console.error('[avatar upload]', err);
      dispatch(showToast({ message: err?.message || 'Không thể upload ảnh. Thử lại sau.', type: 'error' }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Fetch artist profile (name + photo) khi user là artist
  useEffect(() => {
    if (user?.role !== ROLES.ARTIST) return;

    (async () => {
      const artistId = user.artist_id;
      if (artistId) {
        const artistData = await getArtistById(artistId);
        if (artistData) {
          setArtistProfile(artistData);
          // Cập nhật displayName với tên từ artist record
          setDisplayName(artistData.name || user.name || user.username || '');
          if (artistData.isVerified) {
            dispatch(setVerifyStatus({ status: VERIFY_STATUS.APPROVED }));
            return;
          }
        }
      }

      // Fallback: check artist-request flow
      try {
        const data = await api.get('/me/artist-request');
        const status = String(data?.status || '').toLowerCase();
        const mappedStatus = status === 'approved'
          ? VERIFY_STATUS.APPROVED
          : status === 'pending'
            ? VERIFY_STATUS.PENDING
            : VERIFY_STATUS.IDLE;
        dispatch(setVerifyStatus({ status: mappedStatus }));
      } catch {
        // If the backend is unavailable or endpoint is missing, do nothing.
      }
    })();
  }, [dispatch, user?.role, user?.artist_id]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    try {
      if (user.role === ROLES.ARTIST && artistProfile?.id) {
        // Artist: cập nhật qua PUT /artists/{id}
        const updated = await api.put(`/artists/${artistProfile.id}`, { name: displayName.trim() });
        setArtistProfile({ ...artistProfile, name: displayName.trim() });
        dispatch(showToast({ message: 'Cập nhật tên nghệ sĩ thành công!', type: 'success' }));
      } else {
        // User thường: cập nhật qua PUT /me
        await updateProfile({ displayName: displayName.trim() });
        dispatch(loginSuccess({ ...user, name: displayName.trim(), username: displayName.trim() }));
        dispatch(showToast({ message: 'Cập nhật thành công!', type: 'success' }));
      }
      setIsEditing(false);
    } catch {
      dispatch(showToast({ message: 'Không thể cập nhật. Thử lại sau.', type: 'error' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Restore tên gốc: ưu tiên artistProfile.name nếu là artist
    const originalName = (user.role === ROLES.ARTIST && artistProfile?.name) || user?.name || user?.username || '';
    setDisplayName(originalName);
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
            src={(user.role === ROLES.ARTIST && artistProfile?.photoUrl) || user.avatar_url || '../public/pictures/user_default.png'}
            alt={user.username}
            className="w-28 h-28 rounded-full object-cover shadow-2xl"
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition"
          >
            {isUploadingAvatar ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera size={20} className="text-white" />
            )}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-400 uppercase mb-1">Hồ sơ</p>
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={(user.role === ROLES.ARTIST && artistProfile?.name) || user.name || user.username}
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
              <h1 className="text-4xl font-extrabold text-white truncate">
                {(user.role === ROLES.ARTIST && artistProfile?.name) || displayName}
              </h1>
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
          <p className="text-2xl font-bold text-white">{playlistIds.length}</p>
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
                {/* isVerified trên artist record (admin xác minh từ panel) HOẶC
                    verifyStatus từ artist-request (approve qua luồng request) */}
                <p className={`text-xs mt-0.5 ${(verifyStatus === VERIFY_STATUS.APPROVED || user.isVerified) ? 'text-green-400' : verifyStatus === VERIFY_STATUS.PENDING ? 'text-yellow-400' : 'text-neutral-400'}`}>
                  {(verifyStatus === VERIFY_STATUS.APPROVED || user.isVerified) ? 'Đã xác minh' : verifyStatus === VERIFY_STATUS.PENDING ? 'Đang chờ duyệt' : 'Chưa xác minh'}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock size={20} /> Lịch sử nghe nhạc
          </h2>
          {historyEntries.length > 0 && (
            <button
              onClick={async () => {
                dispatch(clearAllHistory());
                dispatch(showToast({ message: 'Đã xóa lịch sử nghe nhạc', type: 'success' }));
              }}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition"
            >
              <Trash2 size={14} /> Xóa lịch sử
            </button>
          )}
        </div>
        {historyEntries.length === 0 ? (
          <p className="text-neutral-400 text-sm">Bạn chưa nghe bài hát nào gần đây.</p>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {historyEntries.map((entry) => (
              <CardSong key={`${entry.songId}-${entry.played_at}`} song={{
                song_id: entry.songId,
                title: entry.title,
                artist_name: entry.artist_name,
                artist_id: entry.artist_id,
                image_url: entry.image_url,
                audio_url: entry.audio_url,
                duration: entry.duration,
              }} onPlay={handlePlayLiked} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
