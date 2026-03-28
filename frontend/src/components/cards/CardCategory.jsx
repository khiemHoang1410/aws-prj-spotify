import { useNavigate } from 'react-router-dom';

export default function CardCategory({ category }) {
  const navigate = useNavigate();

  return (
    <div
      className={`${category.color} rounded-lg p-4 relative overflow-hidden aspect-square cursor-pointer hover:scale-[1.02] transition-transform duration-300`}
      onClick={() => navigate(`/category/${category.id}`)}
    >
      <h3 className="text-white font-bold text-xl">{category.name}</h3>
      <img
        src={category.img}
        alt={category.name}
        className="absolute -right-4 -bottom-4 w-24 h-24 rotate-[25deg] shadow-2xl rounded"
      />
    </div>
  );
}
