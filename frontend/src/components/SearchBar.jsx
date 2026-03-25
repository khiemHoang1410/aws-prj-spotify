import React from 'react';
import { Search, X, Library } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery, submitSearch } from '../store/uiSlice';

export default function SearchBar({ onOpenBrowse }) {
  const dispatch = useDispatch();
  const { searchQuery, isBrowsing, isSearchSubmitted } = useSelector(state => state.ui);

  // Bắt sự kiện bấm phím Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      dispatch(submitSearch());
    }
  };

  // Dữ liệu giả lập cho phần tìm kiếm DropDown nhanh
  const dropDownResults = [
     { id: 1, title: "Chúng Ta Của Hiện Tại", type: "Bài hát", artist: "Sơn Tùng M-TP" },
     { id: 2, title: "Chạy Ngay Đi", type: "Bài hát", artist: "Sơn Tùng M-TP" },
     { id: 3, title: "Sơn Tùng M-TP", type: "Nghệ sĩ", artist: "" }
  ];

  return (
    // relative để DropDown có thể neo vào vị trí của thanh Search
    <div className="relative flex-1 max-w-[400px]">
      
      {/* THANH SEARCH GỐC */}
      <div className="flex items-center bg-[#242424] rounded-full px-3 py-2 w-full border border-transparent hover:border-[#333] hover:bg-[#2a2a2a] focus-within:border-white focus-within:bg-[#242424] transition-all z-30 relative">
        <Search size={22} className="text-[#b3b3b3] mr-3 ml-1" />
        <input 
          type="text" 
          placeholder="Bạn muốn phát nội dung gì?" 
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          onKeyDown={handleKeyDown} // Nắng nghe phím Enter
          className="bg-transparent text-white focus:outline-none w-full text-[15px] placeholder-[#b3b3b3]"
        />
        {searchQuery && (
          <button onClick={() => dispatch(setSearchQuery(''))} className="text-[#b3b3b3] hover:text-white mr-2">
            <X size={20} />
          </button>
        )}
        <div className="w-[1px] h-6 bg-[#b3b3b3]/30 mx-2"></div>
        
        {/* Nút Library - Sáng màu trắng nếu isBrowsing đang là true */}
        <button 
          onClick={onOpenBrowse} 
          className={`ml-2 mr-1 transition-colors ${isBrowsing ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}
          title="Duyệt tìm chuyên mục"
        >
          {/* Dùng fill nếu muốn icon đặc ruột khi đang active */}
          <Library size={22} className={isBrowsing ? "fill-white" : ""} />
        </button>
      </div>

      {/* GIAO DIỆN DROPDOWN (Chỉ hiện khi có gõ chữ VÀ chưa bấm Enter) */}
      {searchQuery.length > 0 && !isSearchSubmitted && (
        <div className="absolute top-14 left-0 w-full bg-[#242424] rounded-lg shadow-2xl z-50 p-2 border border-[#333]">
          <h4 className="text-white font-bold px-3 py-2 text-sm">Kết quả liên quan</h4>
          <div className="flex flex-col gap-1 mt-1">
            {dropDownResults.map((item) => (
               <div key={item.id} className="flex flex-col px-3 py-2 hover:bg-[#333] rounded-md cursor-pointer group">
                  <span className="text-white text-base font-semibold group-hover:underline">{item.title}</span>
                  <span className="text-[#b3b3b3] text-sm">{item.type} {item.artist ? `• ${item.artist}` : ''}</span>
               </div>
            ))}
          </div>
          {/* Nút xem toàn bộ */}
          <div 
             className="px-3 py-3 mt-2 text-sm font-bold text-white hover:text-green-500 cursor-pointer border-t border-[#333]"
             onClick={() => dispatch(submitSearch())}
          >
             Xem tất cả kết quả cho "{searchQuery}"
          </div>
        </div>
      )}

    </div>
  );
}