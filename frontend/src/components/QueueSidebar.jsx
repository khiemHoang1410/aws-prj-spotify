import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Play } from 'lucide-react';
import { toggleRightSidebar } from '../store/uiSlice';
import { clearQueue, setCurrentSong } from '../store/playerSlice';
import { getPlayHistory } from '../services/UserService';

export default function QueueSidebar() {
  const dispatch = useDispatch();
  const { isRightSidebarOpen } = useSelector(state => state.ui);
  const { queue, currentSong } = useSelector(state => state.player);
  const { user } = useSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' hoặc 'history'
  const [history, setHistory] = useState([]);

  // Tự động tải lịch sử khi chuyển sang tab "Đã nghe gần đây"
  useEffect(() => {
    if (activeTab === 'history' && user?.user_id) {
       getPlayHistory(user.user_id).then(data => setHistory(data));
    }
  }, [activeTab, user]);

  // Nếu Redux bảo đóng thì ẩn component này đi
  if (!isRightSidebarOpen) return null;

  return (
    <div className="w-80 bg-[#121212] flex flex-col h-full rounded-lg mt-2 mr-2 mb-2 p-4 overflow-hidden flex-shrink-0">
       
       {/* 1. HEADER & TABS */}
       <div className="flex items-center justify-between mb-6">
         <div className="flex gap-4">
           <button
             className={`font-bold transition ${activeTab === 'queue' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}
             onClick={() => setActiveTab('queue')}
           >
             Danh sách chờ
           </button>
           <button
             className={`font-bold transition ${activeTab === 'history' ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}
             onClick={() => setActiveTab('history')}
           >
             Đã nghe gần đây
           </button>
         </div>
         <button className="text-[#b3b3b3] hover:text-white bg-transparent hover:bg-[#282828] p-1 rounded-full transition" onClick={() => dispatch(toggleRightSidebar())}>
           <X size={20} />
         </button>
       </div>

       {/* 2. NỘI DUNG CHÍNH (Có thể cuộn) */}
       <div className="flex-1 overflow-y-auto pb-4">
         {activeTab === 'queue' ? (
            <div className="flex flex-col gap-6">
               
               {/* --- A. Đang phát (Now Playing) --- */}
               <div>
                 <h3 className="text-white font-bold mb-3">Đang phát</h3>
                 {currentSong ? (
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] group transition cursor-pointer">
                       <img src={currentSong.image_url} className="w-12 h-12 rounded shadow-md object-cover" alt="cover"/>
                       <div className="flex flex-col overflow-hidden">
                          <span className="text-[#1ed760] font-semibold truncate">{currentSong.title}</span>
                          <span className="text-[#b3b3b3] text-sm truncate">{currentSong.artist_name}</span>
                       </div>
                    </div>
                 ) : (
                    <p className="text-[#b3b3b3] text-sm px-2">Chưa có bài hát nào</p>
                 )}
               </div>

               {/* --- B. Tiếp theo (Next in Queue) --- */}
               <div>
                 <div className="flex items-center justify-between mb-3 pr-2">
                    <h3 className="text-white font-bold">Tiếp theo</h3>
                    {queue.length > 0 && (
                       <button className="text-sm font-bold text-[#b3b3b3] hover:text-white hover:underline transition" onClick={() => dispatch(clearQueue())}>
                         Xóa danh sách
                       </button>
                    )}
                 </div>
                 <div className="flex flex-col gap-1">
                    {queue.length > 0 ? queue.map((song, idx) => (
                       <div key={idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition" onClick={() => dispatch(setCurrentSong(song))}>
                          <div className="relative w-12 h-12 flex-shrink-0">
                             <img src={song.image_url} className="w-full h-full rounded shadow-md object-cover" alt="cover"/>
                             <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded">
                                <Play fill="white" size={16} className="ml-0.5"/>
                             </div>
                          </div>
                          <div className="flex flex-col overflow-hidden">
                             <span className="text-white font-semibold group-hover:underline truncate">{song.title}</span>
                             <span className="text-[#b3b3b3] text-sm truncate">{song.artist_name}</span>
                          </div>
                       </div>
                    )) : (
                       <p className="text-[#b3b3b3] text-sm px-2">Hàng chờ trống</p>
                    )}
                 </div>
               </div>
            </div>
         ) : (
            
            /* --- C. Đã nghe gần đây (Recently Played) --- */
            <div className="flex flex-col gap-1">
               {history.length > 0 ? history.map((song, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition" onClick={() => dispatch(setCurrentSong(song))}>
                     <div className="relative w-12 h-12 flex-shrink-0">
                        <img src={song.image_url} className="w-full h-full rounded shadow-md object-cover" alt="cover"/>
                        <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded">
                           <Play fill="white" size={16} className="ml-0.5"/>
                        </div>
                     </div>
                     <div className="flex flex-col overflow-hidden">
                        <span className="text-white font-semibold group-hover:underline truncate">{song.title}</span>
                        <span className="text-[#b3b3b3] text-sm truncate">{song.artist_name}</span>
                     </div>
                  </div>
               )) : (
                  <p className="text-[#b3b3b3] text-sm px-2">Chưa có lịch sử nghe nhạc</p>
               )}
            </div>
         )}
       </div>
    </div>
  );
}