import { useNavigate } from 'react-router-dom';
import { Disc3, Home, Compass, ArrowLeft, Music2 } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center select-none">
      {/* Animated Glowing Vinyl Icon */}
      <div className="relative mb-6 group">
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl group-hover:bg-green-500/30 transition-all duration-700" />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700/60 shadow-2xl flex items-center justify-center">
          <Disc3 size={64} className="text-green-500 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute w-7 h-7 rounded-full bg-[#121212] border-2 border-neutral-700 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-neutral-900 border border-neutral-700 rounded-full p-1.5 text-neutral-400">
          <Music2 size={16} />
        </div>
      </div>

      {/* 404 Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/50 text-green-400 text-xs font-semibold tracking-wider uppercase mb-3">
        Lỗi 404 • Không tìm thấy
      </div>

      {/* Main Title & Description */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
        Lạc mất giai điệu rồi!
      </h1>
      <p className="text-neutral-400 text-sm md:text-base max-w-md mx-auto mb-8 leading-relaxed">
        Trang bạn đang tìm kiếm không tồn tại, đã bị đổi tên hoặc link nhạc đã hết hạn. Hãy thử quay lại hoặc khám phá những bài hát mới.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 hover:bg-green-400 text-black font-bold text-sm shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Home size={18} />
          Về Trang chủ
        </button>

        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm border border-neutral-700/80 hover:border-neutral-500 hover:scale-105 active:scale-95 transition-all"
        >
          <Compass size={18} />
          Khám phá Thể loại
        </button>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-neutral-400 hover:text-white font-medium text-sm hover:bg-neutral-800/50 transition-all"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>

      {/* Quick Discovery Tags */}
      <div className="pt-6 border-t border-neutral-800/80 max-w-md w-full">
        <p className="text-xs text-neutral-500 mb-3 font-medium uppercase tracking-wider">
          Gợi ý nhanh cho bạn
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['V-Pop', 'Sơn Tùng M-TP', 'MONO', 'Rap Việt', 'Sky Tour'].map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-green-400 hover:border-green-500/40 transition"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
