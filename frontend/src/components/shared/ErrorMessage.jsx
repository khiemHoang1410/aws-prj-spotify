import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 rounded border border-red-800 bg-red-950/30 px-4 py-3">
      <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
      <span className="text-red-400 text-sm flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium transition"
        >
          <RefreshCw size={14} />
          Thử lại
        </button>
      )}
    </div>
  );
}
