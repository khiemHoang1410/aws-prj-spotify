import React from 'react';
import { Play } from 'lucide-react';
import CardArtist from './CardArtist';

export default function SearchResults({ query, onPlaySong }) {
  // Mock Data tạo cảm giác thật
  const topResult = { name: "Sơn Tùng M-TP", type: "Nghệ sĩ", img: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1" };
  const mockSongs = [
    { song_id: "S1", title: "Chạy Ngay Đi", artist_name: "Sơn Tùng M-TP", image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052", duration: 245 },
    { song_id: "S2", title: "Chúng Ta Của Hiện Tại", artist_name: "Sơn Tùng M-TP", image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052", duration: 300 },
    { song_id: "S3", title: "Muộn Rồi Mà Sao Còn", artist_name: "Sơn Tùng M-TP", image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052", duration: 275 },
    { song_id: "S4", title: "Nơi Này Có Anh", artist_name: "Sơn Tùng M-TP", image_url: "https://i.scdn.co/image/ab67616d0000b273c50961b7b7be0034ea366052", duration: 260 }
  ];
  const mockArtists = [
    { artist_id: "A1", name: "Sơn Tùng M-TP", image_url: "https://i.scdn.co/image/ab6761610000e5eb80358ee1e2d42b6a51cc20f1" },
    { artist_id: "A2", name: "MONO", image_url: "https://i.scdn.co/image/ab6761610000e5eb9d0e2f5b6b668d71231f24e9" },
  ];

  return (
    <div className="flex flex-col gap-10 mt-2 pb-8">
      
      {/* KHỐI 1: KẾT QUẢ HÀNG ĐẦU & BÀI HÁT */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Kết quả hàng đầu (Cột trái) */}
        <div className="w-full lg:w-2/5 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-4">Kết quả hàng đầu</h2>
          <div className="bg-[#181818] hover:bg-[#282828] transition duration-300 cursor-pointer p-5 rounded-lg relative group flex-1 flex flex-col justify-center">
            <img src={topResult.img} className="w-[100px] h-[100px] rounded-full mb-6 object-cover shadow-lg" alt={topResult.name} />
            <h3 className="text-3xl font-bold text-white mb-2">{topResult.name}</h3>
            <div className="flex items-center gap-2">
              <span className="bg-[#121212] text-white text-sm font-bold px-3 py-1 rounded-full">{topResult.type}</span>
            </div>
            {/* Nút Play to bự */}
            <button className="absolute bottom-6 right-6 bg-green-500 text-black rounded-full p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-105 hover:bg-green-400">
              <Play fill="currentColor" size={24} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Danh sách 4 Bài hát (Cột phải) */}
        <div className="w-full lg:w-3/5 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-4">Bài hát</h2>
          <div className="flex flex-col gap-1">
            {mockSongs.map((song) => (
              <div 
                key={song.song_id} 
                className="flex items-center justify-between p-2 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition"
                onClick={() => onPlaySong(song)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-11 h-11 flex-shrink-0">
                    <img src={song.image_url} className="w-full h-full object-cover rounded" alt={song.title} />
                    {/* Hover hiện nút play đè lên ảnh nhỏ */}
                    <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded">
                      <Play fill="white" size={16} className="ml-0.5" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-base hover:underline">{song.title}</span>
                    <span className="text-[#b3b3b3] text-sm hover:underline">{song.artist_name}</span>
                  </div>
                </div>
                <span className="text-[#b3b3b3] text-sm mr-4">{Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KHỐI 2: NGHỆ SĨ LIÊN QUAN */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Nghệ sĩ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {mockArtists.map(artist => <CardArtist key={artist.artist_id} artist={artist} />)}
        </div>
      </div>

      {/* KHỐI 3: ALBUM LIÊN QUAN */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Album liên quan</h2>
        <div className="text-[#b3b3b3] text-sm">Giao diện thẻ Album...</div>
      </div>

      {/* KHỐI 4: PLAYLIST LIÊN QUAN */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Playlist liên quan</h2>
        <div className="text-[#b3b3b3] text-sm">Giao diện thẻ Playlist...</div>
      </div>

    </div>
  );
}