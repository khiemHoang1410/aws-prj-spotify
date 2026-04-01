import React from 'react';
import { X } from 'lucide-react';

/**
 * AdminBulkToolbar — shown when items are selected
 *
 * Props:
 * - count: number of selected items
 * - actions: [{ label, onClick, variant: 'danger' | 'primary' }]
 * - onClear: fn to clear selection
 */
export default function AdminBulkToolbar({ count, actions = [], onClear }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 mb-4 bg-neutral-800 border border-neutral-700 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-white font-medium">{count} mục đã chọn</span>
        <button
          onClick={onClear}
          className="text-neutral-400 hover:text-white transition"
          title="Bỏ chọn"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={`px-3 py-1.5 text-xs font-medium rounded transition ${
              action.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
