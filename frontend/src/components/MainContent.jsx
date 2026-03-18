import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSong } from '../store/playerSlice';
import { openModal, logout } from '../store/authSlice';
import CardSong from './CardSong';
import { getSongs } from '../services/SongService';

export default function MainContent() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lấy trạng thái đăng nhập từ Redux
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        setLoading(true);
        const data = await getSongs();
        setSongs(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu bài hát:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMusic();
  }, []);

  // HÀM QUAN TRỌNG: Kiểm tra trước khi phát nhạc
  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login')); // Ép mở bảng Đăng nhập
      return; 
    }
    dispatch(setCurrentSong(song));
  };

return (
    <div className="p-6 min-h-full bg-gradient-to-b from-[#1f1f1f] to-[#121212] relative">
      
      {/* 1. TOP BAR (Khu vực Header ảo - Sẽ dính trên cùng) */}
      <div className="flex items-center justify-end mb-8 sticky top-0 bg-[#121212]/95 backdrop-blur z-10 p-4 -mt-6 -mx-6 shadow-md">
        
        {/* Khu vực Auth (Bên phải) */}
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <button 
                className="text-[#b3b3b3] font-bold hover:text-white hover:scale-105 transition"
                onClick={() => dispatch(openModal('register'))}
              >
                Đăng ký
              </button>
              <button 
                className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition"
                onClick={() => dispatch(openModal('login'))}
              >
                Đăng nhập
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full border-2 border-[#282828]" />
              <span className="text-white font-bold hidden sm:block">{user.username}</span>
              <button 
                className="bg-[#282828] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#3e3e3e] transition"
                onClick={() => {
                  dispatch(logout());
                  window.location.reload();
                }}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. KHU VỰC TIÊU ĐỀ NỘI DUNG (Đề xuất & Hiện tất cả cùng 1 hàng) */}
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
          Đề xuất cho bạn
        </h2>
        
        {/* Chữ Hiện tất cả - Sau này có state isSearching thì dùng {isSearching ? null : <span>...</span>} để ẩn */}
        <span className="text-sm font-bold text-[#b3b3b3] hover:underline cursor-pointer">
          Hiện tất cả
        </span>
      </div>

      {/* KHU VỰC GRID CHỨA BÀI HÁT */}
      {loading ? (
        <div className="text-[#b3b3b3] text-center mt-10">Đang tải nhạc...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {songs.length > 0 ? (
            songs.map((song) => (
              <CardSong 
                key={song.song_id} 
                song={song} 
                onPlay={handlePlaySong} 
              />
            ))
          ) : (
            <div className="text-[#b3b3b3] col-span-full">Không có bài hát nào.</div>
          )}
        </div>
      )}

    </div>
  );
}