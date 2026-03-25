import React from 'react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {Icon && <Icon size={48} className="text-neutral-400 opacity-40" />}
      {title && <p className="text-white font-semibold text-lg">{title}</p>}
      {description && <p className="text-neutral-400 text-sm max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-2 rounded-full transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
