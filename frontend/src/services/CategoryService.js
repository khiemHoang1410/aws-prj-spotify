// Dữ liệu giả lập các danh mục (Categories)
const mockCategories = [
  { id: 'vpop',   name: 'V-Pop',            color: 'bg-red-500',     img: 'https://i.scdn.co/image/ab67706f000000029b3524dbdf7ce11e5a5266b0' },
  { id: 'pop',    name: 'Pop',              color: 'bg-blue-600',    img: 'https://i.scdn.co/image/ab67706f00000002b70e0223f544b1faa2e95ed0' },
  { id: 'kpop',   name: 'K-Pop',            color: 'bg-pink-500',    img: 'https://i.scdn.co/image/ab67706f000000021bb0143a41b7123aa2e17ea4' },
  { id: 'ballad', name: 'Ballad',           color: 'bg-orange-800',  img: 'https://i.scdn.co/image/ab67706f00000002c414e7daf34690c9f983f76e' },
  { id: 'rap',    name: 'Rap/Hip-Hop',      color: 'bg-orange-500',  img: 'https://i.scdn.co/image/ab67706f000000029bb6af539d072de34548d15c' },
  { id: 'indie',  name: 'Indie',            color: 'bg-purple-600',  img: 'https://i.scdn.co/image/ab67706f00000002a2eb1e4eb41fdb454a8e6fcc' },
  { id: 'rnb',    name: 'R\u0026B',          color: 'bg-indigo-600',  img: 'https://i.scdn.co/image/ab67706f00000002f232b6e1b7db775cb5c9f564' },
  { id: 'edm',    name: 'EDM',              color: 'bg-teal-500',    img: 'https://i.scdn.co/image/ab67706f00000002030f148419c8bf4eb3dc6da2' },
];

export const getCategories = async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockCategories), 300); // Giả lập chờ API
  });
};
