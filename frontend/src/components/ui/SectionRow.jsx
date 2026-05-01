import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * SectionRow — 1 hàng ngang scroll như Spotify
 * - Ẩn scrollbar
 * - 2 rìa mờ dần (fade) khi còn content để scroll
 * - Nút mũi tên trái/phải
 */
export default function SectionRow({ title, sectionKey, children, showMore = true }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const items = Array.isArray(children) ? children : (children ? [children] : []);
  if (!items.length) return null;

  // Kiểm tra trạng thái scroll để hiện/ẩn fade + nút
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    // ResizeObserver để re-check khi layout thay đổi
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [checkScroll, items.length]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll 3 cards mỗi lần (~180px * 3)
    el.scrollBy({ left: dir * 180 * 3, behavior: 'smooth' });
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`text-2xl font-bold text-white ${showMore && sectionKey ? 'hover:underline cursor-pointer' : ''}`}
          onClick={() => showMore && sectionKey && navigate(`/section/${sectionKey}`)}
        >
          {title}
        </h2>
        {showMore && sectionKey && (
          <button
            onClick={() => navigate(`/section/${sectionKey}`)}
            className="text-xs font-bold text-[#b3b3b3] hover:text-white uppercase tracking-widest transition flex-shrink-0"
          >
            Hiện tất cả
          </button>
        )}
      </div>

      {/* Scroll container với fade + nút */}
      <div className="relative group">

        {/* Fade trái */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 z-10 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(to right, #121212 0%, transparent 100%)',
            opacity: canScrollLeft ? 1 : 0,
          }}
        />

        {/* Fade phải */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 z-10 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(to left, #121212 0%, transparent 100%)',
            opacity: canScrollRight ? 1 : 0,
          }}
        />

        {/* Nút trái */}
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20
                       w-8 h-8 flex items-center justify-center
                       bg-neutral-800/90 hover:bg-neutral-700 text-white
                       rounded-full shadow-lg transition
                       opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Nút phải */}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20
                       w-8 h-8 flex items-center justify-center
                       bg-neutral-800/90 hover:bg-neutral-700 text-white
                       rounded-full shadow-lg transition
                       opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Scroll row — ẩn scrollbar */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
        >
          {items.map((child, i) => (
            <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px]">
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
