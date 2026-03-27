import React from 'react';
import { useDispatch } from 'react-redux';
import { setActiveCategory, setView } from '../../store/uiSlice';

export default function CardCategory({ category }) {
  const dispatch = useDispatch();

  return (
    <div 
      className={`${category.color} rounded-lg p-4 relative overflow-hidden aspect-square cursor-pointer hover:scale-[1.02] transition-transform duration-300`}
      onClick={() => {
        dispatch(setActiveCategory({ id: category.id, name: category.name }));
        dispatch(setView('category-detail'));
      }}
    >
      {/* Tên danh mục */}
      <h3 className="text-white font-bold text-xl">{category.name}</h3>
      
      {/* Ảnh bìa: Đặt absolute ở góc phải dưới, xoay 25 độ giống hệt Spotify */}
      <img 
        src={category.img} 
        alt={category.name} 
        className="absolute -right-4 -bottom-4 w-24 h-24 rotate-[25deg] shadow-2xl rounded"
      />
    </div>
  );
}