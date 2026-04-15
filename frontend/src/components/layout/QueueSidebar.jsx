import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Play } from 'lucide-react';
import { toggleRightSidebar } from '../../store/uiSlice';
import { clearQueue, setCurrentSong } from '../../store/playerSlice';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export default function QueueSidebar() {
  const dispatch = useDispatch();
  const { isRightSidebarOpen } = useSelector(state => state.ui);
  const { queue, currentSong } = useSelector(state => state.player);

  if (!isRightSidebarOpen) return null;

  return (
    <div className="w-80 bg-[#121212] flex flex-col h-full rounded-lg mt-2 mr-2 mb-2 p-4 overflow-hidden flex-shrink-0">
       
       {/* HEADER */}
       <div className="flex items-center justify-between mb-6">
         <h2 className="font-bold text-white text-base">Danh sách chờ</h2>
         <button className="text-[#b3b3b3] hover:text-white bg-transparent hover:bg-[#282828] p-1 rounded-full transition" onClick={() => dispatch(toggleRightSidebar())}>
           <X size={20} />
         </button>
       </div>

       {/* NỘI DUNG */}
       <div className="flex-1 overflow-y-auto pb-4 flex flex-col gap-6">
         
         {/* Đang phát */}
         <div>
           <h3 className="text-white font-bold mb-3">Đang phát</h3>
           {currentSong ? (
             <div className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] group transition cursor-pointer">
               <img src={currentSong.image_url || IMG_FALLBACK} className="w-12 h-12 rounded shadow-md object-cover" alt="cover"/>
               <div className="flex flex-col overflow-hidden">
                 <span className="text-[#1ed760] font-semibold truncate">{currentSong.title}</span>
                 <span className="text-[#b3b3b3] text-sm truncate">{currentSong.artist_name}</span>
               </div>
             </div>
           ) : (
             <p className="text-[#b3b3b3] text-sm px-2">Chưa có bài hát nào</p>
           )}
         </div>

         {/* Tiếp theo */}
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
                   <img src={song.image_url || IMG_FALLBACK} className="w-full h-full rounded shadow-md object-cover" alt="cover"/>
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
    </div>
  );
}
