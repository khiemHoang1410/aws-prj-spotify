import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getArtistInfo, followArtist } from '../../services/ArtistService';
import { showToast } from '../../store/uiSlice';
import { toggleFollowArtist } from '../../store/authSlice';
import { setCurrentSong } from '../../store/playerSlice';
import { BadgeCheck, X, Music, ExternalLink, ListMusic } from 'lucide-react';

export default function BottomInfo({ currentSong }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { followedArtists } = useSelector((state) => state.auth);
  const queue = useSelector((state) => state.player.queue);

  const [artistData, setArtistData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const artistId = artistData?.id || artistData?.artist_id || null;
  const isFollowing = Array.isArray(followedArtists) && artistId
    ? followedArtists.includes(artistId)
    : false;

  useEffect(() => {
    if (currentSong?.artist_name) {
      getArtistInfo(currentSong.artist_name).then(data => setArtistData(data));
    }
  }, [currentSong]);

  if (!artistData) return null;

  const handleFollowToggle = async () => {
    if (!artistId) {
      dispatch(showToast({ message: 'Không tìm thấy nghệ sĩ để theo dõi', type: 'error' }));
      return;
    }
    dispatch(toggleFollowArtist(artistId));
    const response = await followArtist(artistId);
    const success = response?.success !== false;
    if (!success) {
      dispatch(toggleFollowArtist(artistId));
      dispatch(showToast({ message: 'Không thể cập nhật theo dõi nghệ sĩ', type: 'error' }));
      return;
    }
    dispatch(showToast({
      message: isFollowing ? 'Đã bỏ theo dõi nghệ sĩ' : 'Đã theo dõi nghệ sĩ',
      type: 'success',
    }));
  };

  return (
    <>
      <div className="w-full max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">

        {/* ── KHỐI 1: ABOUT ARTIST ── */}
        <div
          className="relative bg-[#282828] rounded-2xl overflow-hidden cursor-pointer group h-80 shadow-xl transition hover:scale-[1.015]"
          onClick={() => setShowModal(true)}
        >
          <img
            src={artistData.photo_url || artistData.image_url || '/pictures/whiteBackground.jpg'}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition duration-300"
            alt={artistData.name}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
          />
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">About the artist</h3>
              <ExternalLink size={15} className="text-white/40 group-hover:text-white/80 transition" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-extrabold text-white">{artistData.name}</h2>
                {artistData.isVerified && <BadgeCheck size={20} className="text-blue-400 flex-shrink-0" />}
              </div>
              {artistData.monthly_listeners ? (
                <p className="text-[#b3b3b3] text-xs mb-3">
                  {Number(artistData.monthly_listeners).toLocaleString('vi-VN')} người nghe hàng tháng
                </p>
              ) : null}
              <p className="text-white/80 text-sm line-clamp-3 leading-relaxed">{artistData.bio}</p>
            </div>
          </div>
        </div>

        {/* ── CỘT PHẢI ── */}
        <div className="flex flex-col gap-5">

          {/* KHỐI 2: CREDITS */}
          <div className="bg-[#282828] rounded-2xl p-5 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Credits</h3>
              <button
                className="text-xs text-[#b3b3b3] hover:text-white hover:underline transition"
                onClick={() => artistId && navigate(`/artist/${artistId}`)}
              >
                Xem tất cả
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={artistData.photo_url || artistData.image_url || '/pictures/whiteBackground.jpg'}
                alt={artistData.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-white font-semibold truncate cursor-pointer hover:underline"
                  onClick={() => artistId && navigate(`/artist/${artistId}`)}
                >
                  {artistData.name}
                </p>
                <p className="text-xs text-[#b3b3b3] truncate">{artistData.credits || 'Main Artist'}</p>
              </div>
              <button
                className={`border px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition hover:scale-105 ${
                  isFollowing
                    ? 'border-green-500 text-green-400 hover:border-green-400'
                    : 'border-[#b3b3b3] text-white hover:border-white hover:bg-white/10'
                }`}
                onClick={handleFollowToggle}
              >
                {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </button>
            </div>
          </div>

          {/* KHỐI 3: YOUR QUEUE */}
          <div className="bg-[#282828] rounded-2xl p-5 shadow-md flex-1">
            <div className="flex items-center gap-2 mb-4">
              <ListMusic size={16} className="text-neutral-400" />
              <h3 className="text-base font-bold text-white">Hàng chờ phát</h3>
              {queue.length > 0 && (
                <span className="ml-auto text-xs text-neutral-500">{queue.length} bài</span>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="flex flex-col items-center py-4 gap-2 text-neutral-500">
                <Music size={28} className="opacity-40" />
                <p className="text-sm">Hàng chờ trống</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                {queue.slice(0, 6).map((song, i) => (
                  <div
                    key={song.song_id || i}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition group"
                    onClick={() => dispatch(setCurrentSong(song))}
                  >
                    <span className="text-xs text-neutral-600 w-4 flex-shrink-0 text-right">{i + 1}</span>
                    <img
                      src={song.image_url || '/pictures/whiteBackground.jpg'}
                      alt={song.title}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate group-hover:text-green-400 transition">{song.title}</p>
                      <p className="text-xs text-neutral-400 truncate">{song.artist_name}</p>
                    </div>
                  </div>
                ))}
                {queue.length > 6 && (
                  <p className="text-xs text-neutral-500 text-center pt-1">+{queue.length - 6} bài nữa</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── MODAL ABOUT ARTIST ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#181818] max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Artist cover */}
            <div className="relative h-56">
              <img
                src={artistData.photo_url || artistData.image_url || '/pictures/whiteBackground.jpg'}
                className="w-full h-full object-cover"
                alt={artistData.name}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
            </div>

            <div className="px-8 pb-8 -mt-6 relative">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-extrabold text-white">{artistData.name}</h2>
                    {artistData.isVerified && <BadgeCheck size={22} className="text-blue-400" />}
                  </div>
                  {artistData.monthly_listeners ? (
                    <p className="text-[#1ed760] font-semibold text-sm mt-0.5">
                      {Number(artistData.monthly_listeners).toLocaleString('vi-VN')} người nghe hàng tháng
                    </p>
                  ) : null}
                </div>
                <button
                  className={`border px-5 py-2 rounded-full text-sm font-bold transition hover:scale-105 ${
                    isFollowing
                      ? 'border-green-500 text-green-400 hover:border-green-400'
                      : 'border-white text-white hover:bg-white hover:text-black'
                  }`}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                </button>
              </div>

              <p className="text-[#e5e5e5] text-sm leading-relaxed mb-6">{artistData.bio || 'Không có thông tin giới thiệu.'}</p>

              {artistId && (
                <button
                  className="text-sm text-neutral-400 hover:text-white flex items-center gap-1.5 transition"
                  onClick={() => { setShowModal(false); navigate(`/artist/${artistId}`); }}
                >
                  Xem trang nghệ sĩ <ExternalLink size={13} />
                </button>
              )}
            </div>

            {/* Close button */}
            <button
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 transition"
              onClick={() => setShowModal(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
