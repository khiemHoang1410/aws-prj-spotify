import api from './apiClient';

// Fallback khi chưa có API hoặc BE chưa có endpoint categories
const MOCK_CATEGORIES = [
  { id: 'vpop',   name: 'V-Pop',       color: 'bg-red-500',      img: '/pictures/GenreDefault.png' },
  { id: 'pop',    name: 'Pop',         color: 'bg-blue-600',     img: '/pictures/GenreDefault.png' },
  { id: 'kpop',   name: 'K-Pop',       color: 'bg-pink-500',     img: '/pictures/GenreDefault.png' },
  { id: 'ballad', name: 'Ballad',      color: 'bg-orange-800',   img: '/pictures/GenreDefault.png' },
  { id: 'rap',    name: 'Rap/Hip-Hop', color: 'bg-orange-500',   img: '/pictures/GenreDefault.png' },
  { id: 'indie',  name: 'Indie',       color: 'bg-purple-600',   img: '/pictures/GenreDefault.png' },
  { id: 'rnb',    name: 'R&B',         color: 'bg-indigo-600',   img: '/pictures/GenreDefault.png' },
  { id: 'edm',    name: 'EDM',         color: 'bg-teal-500',     img: '/pictures/GenreDefault.png' },
];

const normalizeGenre = (item) => ({
  id: item?.id || item?.slug || item?.name,
  name: item?.name || 'Genre',
  color: item?.color || 'bg-gradient-to-br from-indigo-500 to-blue-500',
  img: item?.imageUrl || item?.img || item?.image || item?.image_url || '/pictures/GenreDefault.png',
  songCount: item?.songCount ?? 0,
});

export const getGenres = async () => {
  try {
    const data = await api.get('/genres');
    const items = Array.isArray(data) ? data : (data?.items || []);
    if (!Array.isArray(items) || items.length === 0) return MOCK_CATEGORIES.map(normalizeGenre);
    return items.map(normalizeGenre);
  } catch {
    // Graceful fallback nếu BE chưa có endpoint
    return MOCK_CATEGORIES.map(normalizeGenre);
  }
};
