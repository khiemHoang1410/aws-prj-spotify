import React from 'react';
import { Home, Search, Library, Plus } from 'lucide-react';

export default function Sidebar() {
  return (
    // Thẻ nav bọc toàn bộ sidebar, h-full để cao sát màn hình, p-2 để tạo khoảng cách với viền
    <nav className="h-full flex flex-col gap-2 p-2">
      
      {/* KHỐI 1: MENU ĐIỀU HƯỚNG CHÍNH (Home, Search) */}
      <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
        {/* Nút Home */}
        <a href="#" className="flex items-center gap-4 text-white font-bold hover:text-white transition duration-200">
          <Home size={24} />
          <span>Trang chủ</span>
        </a>
        
        {/* Nút Search */}
        <a href="#" className="flex items-center gap-4 text-[#b3b3b3] font-bold hover:text-white transition duration-200">
          <Search size={24} />
          <span>Tìm kiếm</span>
        </a>
      </div>

      {/* KHỐI 2: THƯ VIỆN (Library & Playlists) */}
      <div className="bg-[#121212] rounded-lg p-2 flex-1 flex flex-col overflow-hidden">
        
        {/* Header của Thư viện */}
        <div className="flex items-center justify-between p-2 mb-2">
          <button className="flex items-center gap-3 text-[#b3b3b3] font-bold hover:text-white transition duration-200">
            <Library size={24} />
            <span>Thư viện</span>
          </button>
          
          <button className="text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] p-1 rounded-full transition duration-200">
            <Plus size={20} />
          </button>
        </div>

        {/* Danh sách Playlist (Khu vực này có thể cuộn được nếu có quá nhiều playlist) */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {/* Mock dữ liệu vài cái playlist để giao diện đỡ trống */}
          <div className="mt-2 flex flex-col gap-3">
            <div className="p-2 bg-[#1a1a1a] rounded-md cursor-pointer hover:bg-[#282828] transition duration-200">
              <h4 className="text-white font-semibold">Tạo danh sách phát đầu tiên của bạn</h4>
              <p className="text-sm text-[#b3b3b3] mt-1">Rất dễ, chúng tôi sẽ giúp bạn</p>
              <button className="mt-4 bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:scale-105 transition transform">
                Tạo danh sách phát
              </button>
            </div>
          </div>
        </div>

      </div>
    </nav>
  );
}