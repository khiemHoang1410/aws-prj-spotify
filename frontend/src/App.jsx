import React from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PlayerBar from './components/PlayerBar';
import AuthModal from './components/AuthModal'; // Thêm dòng import

function App() {
  return (
    // Container bao ngoài cùng: Phủ kín màn hình, nền đen tuyền, chữ trắng
    <div className="h-screen w-full flex flex-col bg-black text-white overflow-hidden font-sans">
      
      {/* KHU VỰC THÂN TRÊN: Chiếm phần lớn không gian (flex-1) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* VÙNG 1: SIDEBAR (Cột trái) */}
        {/* w-64 = rộng 256px, flex-shrink-0 = không bị ép nhỏ lại khi màn hình hẹp */}
        <aside className="w-64 bg-black flex-shrink-0 flex flex-col">
          <Sidebar />
        </aside>

        {/* VÙNG 2: MAIN CONTENT (Cột phải) */}
        {/* flex-1 = chiếm toàn bộ phần diện tích còn lại. 
            bg-[#121212] là màu nền xám đen đặc trưng của Spotify.
            overflow-y-auto = cho phép cuộn dọc nếu danh sách nhạc quá dài */}
        <main className="flex-1 bg-[#121212] rounded-lg mt-2 mr-2 mb-2 overflow-y-auto">
          <MainContent />
        </main>

      </div>

      {/* KHU VỰC THÂN DƯỚI: PLAYER BAR */}
      {/* h-24 = cao 96px, nằm cố định dưới đáy */}
      <footer className="h-24 bg-black flex-shrink-0 border-t border-[#282828]">
        <PlayerBar />
      </footer>
      <AuthModal /> {/* Thêm Modal vào đây để nó luôn nổi lên trên cùng */}
    </div>
  );
}

export default App;