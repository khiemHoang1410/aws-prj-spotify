import { useNavigate } from 'react-router-dom';

export default function CardCategory({ category }) {
  const navigate = useNavigate();
  const fallbackColor = 'bg-gradient-to-br from-purple-600 to-blue-500';
  const imageSrc = category?.img || '/pictures/CategoryDefault.png';

  return (
    <div
      className={`${category?.color || fallbackColor} rounded-lg p-4 relative overflow-hidden aspect-square cursor-pointer hover:scale-[1.02] transition-transform duration-300 group`}
      onClick={() => category?.id && navigate(`/category/${category.id}`)}
    >
      <h3 className="text-white font-bold text-xl relative z-10">{category?.name || 'Category'}</h3>
      
      <img
        src={imageSrc}
        alt={category?.name || 'Category'}
        className="absolute right-2 bottom-2 w-20 h-20 rotate-[12deg] shadow-xl rounded object-cover group-hover:scale-110 transition-transform opacity-95 z-0"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/pictures/CategoryDefault.png';
        }}
      />
    </div>
  );
}
