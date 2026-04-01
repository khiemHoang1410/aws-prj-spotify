import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * AdminPagination — Previous/Next controls + page indicator
 *
 * Props:
 * - currentPage: number
 * - hasNext: bool
 * - hasPrev: bool
 * - onNext: fn
 * - onPrev: fn
 */
export default function AdminPagination({ currentPage, hasNext, hasPrev, onNext, onPrev }) {
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-neutral-400">
      <span>Trang {currentPage}</span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition"
        >
          <ChevronLeft size={14} /> Trước
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition"
        >
          Sau <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
