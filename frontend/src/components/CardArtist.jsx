import React from 'react';
import { Play } from 'lucide-react';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

export default function CardArtist({ artist }) {
  return (
    <div className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition duration-300 group cursor-pointer flex flex-col items-center relative">
      <div className="relative w-full aspect-square mb-4">
        <img 
          src={artist.image_url || artist.photo_url || IMG_FALLBACK} 
          alt={artist.name} 
          className="w-full h-full object-cover rounded-full shadow-xl"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
        />
        <button className="absolute bottom-2 right-2 bg-green-500 text-black rounded-full p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-105 hover:bg-green-400">
          <Play fill="currentColor" size={24} className="ml-1" />
        </button>
      </div>
      <h3 className="text-white font-bold truncate text-base w-full text-center">{artist.name}</h3>
      <p className="text-[#b3b3b3] text-sm truncate w-full text-center">Nghệ sĩ</p>
    </div>
  );
}