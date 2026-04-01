import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Play, Heart } from 'lucide-react';
import SongContextMenu from '../ui/SongContextMenu';
import { openModal, toggleLikeSongThunk } from '../../store/authSlice';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export default function CardSong({ song, onPlay }) {
  const dispatch = useDispatch();
  const { isAuthenticated, likedSongs } = useSelector((state) => state.auth);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0 });

  const isLiked = likedSongs.some((s) => s.song_id === song?.song_id);

  const handlePlay = () => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    onPlay(song);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  };

  const handleCloseMenu = () => setContextMenu({ isOpen: false, x: 0, y: 0 });

  return (
    // Class 'group' của Tailwind rất quan trọng ở đây để làm hiệu ứng hover cho phần tử con
    <div 
      className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition duration-300 group cursor-pointer flex flex-col"
      onClick={handlePlay}
      onContextMenu={handleContextMenu}
    >
      {/* Khu vực chứa ảnh và nút Play */}
      <div className="relative mb-4">
        <img 
          src={song.image_url || IMG_FALLBACK} 
          alt={song.title} 
          className="w-full aspect-square object-cover rounded shadow-lg"
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
        />
        
        {/* Nút Play: Mặc định tàng hình (opacity-0), khi hover vào Card thì hiện lên (group-hover:opacity-100) và trượt lên (translate-y-0) */}
        <button 
          className="absolute bottom-2 right-2 bg-green-500 text-black rounded-full p-3 
                     opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 
                     transition-all duration-300 shadow-xl hover:scale-105 hover:bg-green-400"
          onClick={(e) => {
            e.stopPropagation(); // Ngăn chặn sự kiện click lan ra thẻ div bọc ngoài
            handlePlay();
          }}
        >
          <Play fill="currentColor" size={24} />
        </button>

        {/* Heart icon - Like/Unlike */}
        <button
          className={`absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-2 
                     opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110 ${
            isLiked ? 'text-green-500' : 'text-[#b3b3b3] hover:text-white'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isAuthenticated) {
              dispatch(openModal('login'));
              return;
            }
            dispatch(toggleLikeSongThunk(song));
          }}
          title={isLiked ? 'Bỏ thích' : 'Thích'}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Khu vực Text */}
      <h3 className="text-white font-bold truncate text-base mb-1">{song.title}</h3>
      <p className="text-[#b3b3b3] text-sm truncate">{song.artist_name || song.artist?.artist_name}</p>

      {contextMenu.isOpen && (
        <SongContextMenu song={song} position={contextMenu} onClose={handleCloseMenu} />
      )}
    </div>
  );
}
