import React, { useState, useEffect } from 'react';
import CardCategory from './CardCategory';
import { getCategories } from '../services/CategoryService';

export default function SearchContent() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      setCategories(data);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">Duyệt tìm tất cả</h2>
      
      {loading ? (
        <div className="text-[#b3b3b3]">Đang tải danh mục...</div>
      ) : (
        // Grid thay đổi số cột tùy theo kích thước màn hình
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map(cat => (
            <CardCategory key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </div>
  );
}