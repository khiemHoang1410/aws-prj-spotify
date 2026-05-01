import { useNavigate } from 'react-router-dom';

export default function CardGenre({ category }) {
  const navigate = useNavigate();
  const GENRE_FALLBACK = '/pictures/CategoryDefault.png';
  const fallbackColor = 'bg-gradient-to-br from-purple-600 to-blue-500';
  // Chỉ dùng img từ API nếu là chuỗi hợp lệ, tránh nhấp nháy khi null/empty
  const imageSrc = (category?.img && typeof category.img === 'string' && category.img.trim())
    ? category.img
    : GENRE_FALLBACK;

  return (
    <div
      className={`${category?.color || fallbackColor} rounded-lg p-4 relative overflow-hidden aspect-square cursor-pointer hover:scale-[1.02] transition-transform duration-300 group`}
      onClick={() => category?.id && navigate(`/genre/${category.id}`)}
    >
      <h3 className="text-white font-bold text-xl relative z-10">{category?.name || 'Category'}</h3>
      {category?.songCount > 0 && (
        <p className="text-white/80 text-sm mt-1 relative z-10">{category.songCount} songs</p>
      )}

      <img
        src={imageSrc}
        alt={category?.name || 'Genre'}
        className="absolute right-2 bottom-2 w-20 h-20 rotate-[12deg] shadow-xl rounded object-cover group-hover:scale-110 transition-transform opacity-95 z-0"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = GENRE_FALLBACK;
        }}
      />
    </div>
  );
}
