import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { toggleRightSidebar } from '../../store/uiSlice';
import { clearQueue, setCurrentSong, playWithContext, jumpToQueueItem, refillQueueIfNeeded } from '../../store/playerSlice';
import { getAlbumSongs } from '../../services/AlbumService';

const IMG_FALLBACK = '/pictures/artworkDefault.png';
const imgFallback = (e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; };

export default function QueueSidebar() {
  const dispatch = useDispatch();
  const { isRightSidebarOpen } = useSelector(state => state.ui);
  const { queue, currentSong } = useSelector(state => state.player);

  const [albumSongs, setAlbumSongs] = useState([]);

  // Khi queue trống và bài hiện tại có album_id → load các bài còn lại của album
  useEffect(() => {
    if (!isRightSidebarOpen) return;
    if (queue.length > 0) { setAlbumSongs([]); return; }
    if (!currentSong?.album_id) { setAlbumSongs([]); return; }

    getAlbumSongs(currentSong.album_id).then((songs) => {
      // Lọc bỏ bài đang phát
      const others = songs.filter(s => s.song_id !== currentSong.song_id);
      setAlbumSongs(others);
    }).catch(() => setAlbumSongs([]));
  }, [isRightSidebarOpen, queue.length, currentSong?.song_id, currentSong?.album_id]);

  if (!isRightSidebarOpen) return null;

  return (
    <div className="w-80 bg-[#121212] flex flex-col h-full rounded-lg mt-2 mr-2 mb-2 p-4 overflow-hidden flex-shrink-0">
       
       {/* HEADER */}
       <div className="flex items-center justify-between mb-6">
         <h2 className="font-bold text-white">Danh sách chờ</h2>
         <button className="text-[#b3b3b3] hover:text-white bg-transparent hover:bg-[#282828] p-1 rounded-full transition" onClick={() => dispatch(toggleRightSidebar())}>
           <X size={20} />
         </button>
       </div>

       {/* NỘI DUNG */}
       <div className="flex-1 overflow-y-auto pb-4">
         <div className="flex flex-col gap-6">
               
               {/* --- A. Đang phát (Now Playing) --- */}
               <div>
                 <h3 className="text-white font-bold mb-3">Đang phát</h3>
                 {currentSong ? (
                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] group transition cursor-pointer">
                       <img src={currentSong.image_url || IMG_FALLBACK} className="w-12 h-12 rounded shadow-md object-cover" alt="cover" onError={imgFallback}/>
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
                    {queue.length > 0 ? queue.slice(0, 5).map((song, idx) => (
                       <div key={song.song_id || idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition" onClick={() => {
                         dispatch(jumpToQueueItem(song.song_id));
                         dispatch(refillQueueIfNeeded());
                       }}>
                          <div className="relative w-12 h-12 flex-shrink-0">
                             <img src={song.image_url || IMG_FALLBACK} className="w-full h-full rounded shadow-md object-cover" alt="cover" onError={imgFallback}/>
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

               {/* --- C. Từ album này (khi queue trống và bài có album) --- */}
               {queue.length === 0 && albumSongs.length > 0 && (
                 <div>
                   <h3 className="text-white font-bold mb-3">
                     Từ: <span className="text-[#b3b3b3] font-normal">{currentSong?.album_name || 'Album này'}</span>
                   </h3>
                   <div className="flex flex-col gap-1">
                     {albumSongs.map((song, idx) => (
                       <div
                         key={song.song_id || idx}
                         className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition"
                         onClick={() => dispatch(playWithContext({ song, songs: [currentSong, ...albumSongs] }))}
                       >
                         <div className="relative w-12 h-12 flex-shrink-0">
                           <img src={song.image_url || IMG_FALLBACK} className="w-full h-full rounded shadow-md object-cover" alt="cover" onError={imgFallback}/>
                           <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded">
                             <Play fill="white" size={16} className="ml-0.5"/>
                           </div>
                         </div>
                         <div className="flex flex-col overflow-hidden">
                           <span className="text-white font-semibold group-hover:underline truncate">{song.title}</span>
                           <span className="text-[#b3b3b3] text-sm truncate">{song.artist_name}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
       </div>
    </div>
  );
}
