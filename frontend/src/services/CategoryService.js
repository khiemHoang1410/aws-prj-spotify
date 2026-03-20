// Dữ liệu giả lập các danh mục (Categories)
const mockCategories = [
  { id: "CAT_1", name: "Nhạc Việt", color: "bg-red-500", img: "https://i.scdn.co/image/ab67706f000000029b3524dbdf7ce11e5a5266b0" },
  { id: "CAT_2", name: "Pop", color: "bg-blue-600", img: "https://i.scdn.co/image/ab67706f00000002b70e0223f544b1faa2e95ed0" },
  { id: "CAT_3", name: "K-Pop", color: "bg-pink-500", img: "https://i.scdn.co/image/ab67706f000000021bb0143a41b7123aa2e17ea4" },
  { id: "CAT_4", name: "Chill", color: "bg-orange-800", img: "https://i.scdn.co/image/ab67706f00000002c414e7daf34690c9f983f76e" },
  { id: "CAT_5", name: "Hip-Hop", color: "bg-orange-500", img: "https://i.scdn.co/image/ab67706f000000029bb6af539d072de34548d15c" },
  { id: "CAT_6", name: "Thịnh hành", color: "bg-purple-600", img: "https://i.scdn.co/image/ab67706f00000002a2eb1e4eb41fdb454a8e6fcc" },
  { id: "CAT_7", name: "Tâm trạng", color: "bg-indigo-600", img: "https://i.scdn.co/image/ab67706f00000002f232b6e1b7db775cb5c9f564" },
  { id: "CAT_8", name: "Dance/Electronic", color: "bg-teal-500", img: "https://i.scdn.co/image/ab67706f00000002030f148419c8bf4eb3dc6da2" },
];

export const getCategories = async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockCategories), 300); // Giả lập chờ API
  });
};