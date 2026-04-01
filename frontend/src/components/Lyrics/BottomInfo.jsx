import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getArtistInfo } from '../../services/ArtistService';
import { followArtist } from '../../services/ArtistService';
import { showToast } from '../../store/uiSlice';
import { toggleFollowArtist } from '../../store/authSlice';

export default function BottomInfo({ currentSong }) {
  const dispatch = useDispatch();
  const { followedArtists } = useSelector((state) => state.auth);
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
      <div className="w-full max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        
        {/* KHỐI 1: ABOUT ARTIST (Bên Trái) */}
        <div 
          className="relative bg-[#282828] rounded-xl overflow-hidden cursor-pointer group h-80 transition hover:scale-[1.02]"
          onClick={() => setShowModal(true)}
        >
          <img src={artistData.photo_url} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" alt="artist" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-between">
            <h3 className="text-xl font-bold text-white">About the artist</h3>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{artistData.name}</h2>
              <p className="text-[#b3b3b3] text-sm mb-4">{artistData.monthly_listeners} monthly listeners</p>
              <p className="text-white text-sm line-clamp-3">{artistData.bio}</p>
            </div>
          </div>
        </div>

        {/* Cột Phải: Chứa Credits và Queue */}
        <div className="flex flex-col gap-6">
          
          {/* KHỐI 2: CREDITS */}
          <div className="bg-[#282828] rounded-xl p-6 flex flex-col justify-between h-[150px]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">Credits</h3>
              <span className="text-xs text-[#b3b3b3] hover:text-white hover:underline cursor-pointer">Show all</span>
            </div>
            <div className="flex justify-between items-center">
               <div>
                 <p className="text-white font-semibold">{artistData.name}</p>
                 <p className="text-xs text-[#b3b3b3]">{artistData.credits}</p>
               </div>
               <button
                 className={`border px-4 py-1 rounded-full text-sm font-bold hover:scale-105 transition ${
                   isFollowing
                     ? 'border-green-500 text-green-500 hover:border-green-400'
                     : 'border-[#b3b3b3] text-white hover:border-white'
                 }`}
                 onClick={handleFollowToggle}
               >
                 {isFollowing ? 'Following' : 'Follow'}
               </button>
            </div>
          </div>

          {/* KHỐI 3: YOUR QUEUE */}
          <div className="bg-[#282828] rounded-xl p-6 flex flex-col justify-center h-[150px]">
            <h3 className="text-xl font-bold text-white mb-4">Your queue is empty</h3>
            <button className="border border-[#b3b3b3] text-white px-4 py-1.5 rounded-full text-sm font-bold w-max hover:scale-105 hover:border-white">
               Search for something new
            </button>
          </div>

        </div>
      </div>

      {/* MODAL ABOUT ARTIST DỄ ĐỌC HƠN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[#181818] max-w-2xl w-full rounded-xl p-8 text-white relative" onClick={e => e.stopPropagation()}>
             <img src={artistData.photo_url} className="w-full h-64 object-cover rounded-lg mb-6 shadow-2xl" />
             <h2 className="text-4xl font-bold mb-2">{artistData.name}</h2>
             <p className="text-[#1ed760] font-semibold mb-6">{artistData.monthly_listeners} người nghe hàng tháng</p>
             <p className="text-lg leading-relaxed text-[#e5e5e5]">{artistData.bio}</p>
             <button className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white" onClick={() => setShowModal(false)}>X</button>
          </div>
        </div>
      )}
    </>
  );
}
