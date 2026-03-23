import React from 'react';

export default function SkeletonCard({ variant = 'default' }) {
  if (variant === 'row') {
    return (
      <div className="flex items-center gap-3 px-2 py-1 animate-pulse">
        <div className="w-14 h-14 rounded bg-neutral-800 flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-3 bg-neutral-800 rounded w-3/4" />
          <div className="h-3 bg-neutral-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === 'artist') {
    return (
      <div className="flex flex-col items-center gap-3 p-4 animate-pulse">
        <div className="w-40 h-40 rounded-full bg-neutral-800" />
        <div className="h-3 bg-neutral-800 rounded w-24" />
        <div className="h-3 bg-neutral-800 rounded w-16" />
      </div>
    );
  }

  if (variant === 'playlist') {
    return (
      <div className="flex flex-col gap-3 p-4 animate-pulse">
        <div className="w-40 h-40 rounded bg-neutral-800" />
        <div className="h-3 bg-neutral-800 rounded w-3/4" />
        <div className="h-3 bg-neutral-800 rounded w-1/2" />
      </div>
    );
  }

  // default === 'track'
  return (
    <div className="flex flex-col gap-3 p-4 animate-pulse">
      <div className="w-40 h-40 rounded bg-neutral-800" />
      <div className="h-3 bg-neutral-800 rounded w-3/4" />
      <div className="h-3 bg-neutral-800 rounded w-1/2" />
    </div>
  );
}
