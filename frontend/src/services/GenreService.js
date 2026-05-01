import api from './apiClient';

// Fallback khi chưa có API hoặc BE chưa có endpoint categories
const MOCK_CATEGORIES = [
  // Việt Nam
  { id: 'vpop',        name: 'V-Pop',          color: 'bg-red-500',      img: '/pictures/GenreDefault.png' },
  { id: 'ballad',      name: 'Ballad',          color: 'bg-rose-700',     img: '/pictures/GenreDefault.png' },
  { id: 'rap-viet',    name: 'Rap Việt',        color: 'bg-zinc-800',     img: '/pictures/GenreDefault.png' },
  { id: 'nhac-tru-tinh', name: 'Nhạc Trữ Tình', color: 'bg-pink-700',   img: '/pictures/GenreDefault.png' },
  { id: 'nhac-vang',   name: 'Nhạc Vàng',       color: 'bg-yellow-700',  img: '/pictures/GenreDefault.png' },
  { id: 'acoustic',    name: 'Acoustic',         color: 'bg-amber-700',   img: '/pictures/GenreDefault.png' },
  // Quốc tế
  { id: 'pop',         name: 'Pop',              color: 'bg-blue-600',    img: '/pictures/GenreDefault.png' },
  { id: 'kpop',        name: 'K-Pop',            color: 'bg-pink-500',    img: '/pictures/GenreDefault.png' },
  { id: 'rap',         name: 'Rap / Hip-Hop',    color: 'bg-orange-500',  img: '/pictures/GenreDefault.png' },
  { id: 'r&b',         name: 'R&B',              color: 'bg-indigo-600',  img: '/pictures/GenreDefault.png' },
  { id: 'indie',       name: 'Indie',            color: 'bg-purple-600',  img: '/pictures/GenreDefault.png' },
  { id: 'edm',         name: 'EDM',              color: 'bg-teal-500',    img: '/pictures/GenreDefault.png' },
  { id: 'rock',        name: 'Rock',             color: 'bg-gray-700',    img: '/pictures/GenreDefault.png' },
  { id: 'metal',       name: 'Metal',            color: 'bg-slate-800',   img: '/pictures/GenreDefault.png' },
  { id: 'jazz',        name: 'Jazz',             color: 'bg-yellow-800',  img: '/pictures/GenreDefault.png' },
  { id: 'classical',   name: 'Nhạc Cổ Điển',    color: 'bg-stone-600',   img: '/pictures/GenreDefault.png' },
  { id: 'soul',        name: 'Soul',             color: 'bg-orange-700',  img: '/pictures/GenreDefault.png' },
  { id: 'latin',       name: 'Latin',            color: 'bg-orange-600',  img: '/pictures/GenreDefault.png' },
  { id: 'country',     name: 'Country',          color: 'bg-yellow-600',  img: '/pictures/GenreDefault.png' },
  { id: 'folk',        name: 'Folk',             color: 'bg-amber-600',   img: '/pictures/GenreDefault.png' },
  { id: 'blues',       name: 'Blues',            color: 'bg-blue-800',    img: '/pictures/GenreDefault.png' },
  { id: 'alternative', name: 'Alternative',      color: 'bg-violet-700',  img: '/pictures/GenreDefault.png' },
  { id: 'electronic',  name: 'Electronic',       color: 'bg-cyan-600',    img: '/pictures/GenreDefault.png' },
  { id: 'house',       name: 'House',            color: 'bg-sky-600',     img: '/pictures/GenreDefault.png' },
  { id: 'lofi',        name: 'Lo-Fi',            color: 'bg-neutral-600', img: '/pictures/GenreDefault.png' },
  { id: 'jpop',        name: 'J-Pop',            color: 'bg-fuchsia-600', img: '/pictures/GenreDefault.png' },
  { id: 'anime',       name: 'Anime',            color: 'bg-violet-500',  img: '/pictures/GenreDefault.png' },
  { id: 'cpop',        name: 'C-Pop',            color: 'bg-red-600',     img: '/pictures/GenreDefault.png' },
  // Mood
  { id: 'chill',       name: 'Chill',            color: 'bg-sky-700',     img: '/pictures/GenreDefault.png' },
  { id: 'workout',     name: 'Workout',          color: 'bg-green-600',   img: '/pictures/GenreDefault.png' },
  { id: 'party',       name: 'Party',            color: 'bg-pink-600',    img: '/pictures/GenreDefault.png' },
  { id: 'sleep',       name: 'Sleep',            color: 'bg-blue-900',    img: '/pictures/GenreDefault.png' },
  { id: 'focus',       name: 'Focus',            color: 'bg-emerald-700', img: '/pictures/GenreDefault.png' },
  { id: 'romance',     name: 'Lãng Mạn',         color: 'bg-rose-600',    img: '/pictures/GenreDefault.png' },
  { id: 'sad',         name: 'Buồn',             color: 'bg-slate-600',   img: '/pictures/GenreDefault.png' },
  { id: 'happy',       name: 'Vui Vẻ',           color: 'bg-yellow-500',  img: '/pictures/GenreDefault.png' },
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
