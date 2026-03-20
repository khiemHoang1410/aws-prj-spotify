import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSong } from '../store/playerSlice';
import { openModal, logout } from '../store/authSlice';
import { setSearchQuery, toggleBrowse, setView } from '../store/uiSlice'; 
import { ChevronLeft, ChevronRight, Home,Bell, Users } from 'lucide-react'; // Thêm icon Home

import CardSong from './CardSong';
import SearchContent from './SearchContent'; 
import SearchResults from './SearchResults'; 
import SearchBar from './SearchBar'; 
import { getSongs } from '../services/SongService';
import { logoutUser } from '../services/AuthService'; // <-- THÊM DÒNG NÀY

export default function MainContent() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // Thêm dòng này
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { currentView, searchQuery, isBrowsing, isSearchSubmitted } = useSelector((state) => state.ui); 
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

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return; 
    }
    dispatch(setCurrentSong(song));
  };

  return (
    <div className="p-6 min-h-full bg-gradient-to-b from-[#1f1f1f] to-[#121212] relative overflow-x-hidden">
      
      {/* 1. TOP BAR (Thanh công cụ trên cùng) */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#121212]/95 backdrop-blur z-20 p-4 -mt-6 -mx-6 shadow-md">
        
        {/* Nút Back/Forward (Bên trái) */}
        <div className="flex items-center gap-2 w-1/4">
           <button className="bg-black/50 text-[#b3b3b3] p-2 rounded-full cursor-not-allowed"><ChevronLeft size={20}/></button>
           <button className="bg-black/50 text-[#b3b3b3] p-2 rounded-full cursor-not-allowed"><ChevronRight size={20}/></button>
        </div>

        {/* CỤM ĐIỀU HƯỚNG TRUNG TÂM (Trang chủ + Tìm kiếm) */}
        <div className="flex items-center justify-center gap-2 flex-1">
          {/* Nút Home: Bổ sung class fill-white khi đang ở home */}
          <button 
            className={`p-3 rounded-full transition duration-200 ${currentView === 'home' ? 'bg-[#333] text-white' : 'bg-[#242424] text-[#b3b3b3] hover:text-white hover:bg-[#333]'}`}
            onClick={() => dispatch(setView('home'))}
            title="Trang chủ"
          >
            <Home size={22} className={currentView === 'home' ? "fill-white" : ""} />
          </button>

          {/* Thanh SearchBar: Đã chuyển logic quản lý text vào trong SearchBar */}
          <div onClick={() => { if (currentView !== 'search') dispatch(setView('search')); }}>
            <SearchBar onOpenBrowse={() => dispatch(toggleBrowse())} />
          </div>
        </div>
        
        {/* Khu vực Auth (Bên phải) */}
        <div className="flex items-center justify-end gap-4 w-1/4">
          {!isAuthenticated ? (
            <>
              <button className="text-[#b3b3b3] font-bold hover:text-white hover:scale-105 transition whitespace-nowrap" onClick={() => dispatch(openModal('register'))}>Đăng ký</button>
              <button className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition whitespace-nowrap" onClick={() => dispatch(openModal('login'))}>Đăng nhập</button>
            </>
          ) : (
            <div className="flex items-center gap-5 relative">
              
              {/* Nút Nhắn tin / Group */}
              <button className="text-[#b3b3b3] hover:text-white hover:scale-105 transition" title="Trò chuyện">
                <Users size={20} />
              </button>

              {/* Nút Thông báo (Chuông) */}
              <button className="text-[#b3b3b3] hover:text-white hover:scale-105 transition" title="Thông báo mới">
                <Bell size={20} />
              </button>

              {/* Avatar User (Bấm vào để mở Dropdown) */}
              <div 
                className="flex items-center justify-center cursor-pointer bg-black/50 hover:bg-[#282828] p-1 rounded-full transition border-[3px] border-transparent hover:border-[#282828]"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={user.username}
              >
                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              </div>

              {/* Giao diện Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute top-12 right-0 w-48 bg-[#282828] rounded-md shadow-2xl z-50 p-1 border border-[#3e3e3e] text-sm font-semibold">
                  <button className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition">
                    Tài khoản
                  </button>
                  <button className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition">
                    Cài đặt
                  </button>
                  
                  {/* Đường kẻ ngang phân cách */}
                  <div className="h-[1px] bg-[#3e3e3e] my-1"></div>
                  
                  <button 
                    className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                    onClick={async () => {
                      setIsUserMenuOpen(false); // Đóng menu
                      await logoutUser();       // Xóa token localStorage
                      dispatch(logout());       // Reset Redux
                      window.location.reload(); // Quét sạch UI
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* 2. HIỂN THỊ NỘI DUNG TÙY THEO TAB ĐANG CHỌN */}
      {currentView === 'home' && (
        <>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">Đề xuất cho bạn</h2>
            <span className="text-sm font-bold text-[#b3b3b3] hover:underline cursor-pointer">Hiện tất cả</span>
          </div>

          {loading ? (
            <div className="text-[#b3b3b3] text-center mt-10">Đang tải nhạc...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {songs.length > 0 ? songs.map((song) => <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />) : <div className="text-[#b3b3b3] col-span-full">Không có bài hát nào.</div>}
            </div>
          )}
        </>
      )}

      {/* B. NẾU Ở TAB TÌM KIẾM */}
      {currentView === 'search' && (
         <>
            {isBrowsing ? (
               // Đang bấm nút góc phải thanh Search -> Mở Categories
               <SearchContent />
            ) : isSearchSubmitted ? (
               // ĐÃ BẤM ENTER -> Hiển thị toàn màn hình kết quả Search
               <SearchResults query={searchQuery} onPlaySong={handlePlaySong} />
            ) : (
               // CHƯA LÀM GÌ HOẶC ĐANG GÕ (Hiện DropDown) -> Giao diện dưới trống
               <div className="flex flex-col items-center justify-center mt-20 text-[#b3b3b3]">
                  <h3 className="text-xl font-bold text-white mb-2">Bắt đầu tìm kiếm</h3>
                  <p>Tìm bài hát, nghệ sĩ, podcast và nhiều nội dung khác.</p>
               </div>
            )}
         </>
      )}

    </div>
  );
}