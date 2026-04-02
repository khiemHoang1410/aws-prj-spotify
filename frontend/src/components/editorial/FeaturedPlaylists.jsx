import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFeaturedPlaylists,
  selectFeaturedPlaylists,
  selectFeaturedLoading,
  selectFeaturedError,
} from '../../store/editorialSlice';
import CardEditorialPlaylist from './CardEditorialPlaylist';
import SkeletonCard from '../ui/SkeletonCard';

export default function FeaturedPlaylists() {
  const dispatch = useDispatch();
  const items = useSelector(selectFeaturedPlaylists);
  const loading = useSelector(selectFeaturedLoading);
  const error = useSelector(selectFeaturedError);

  useEffect(() => {
    dispatch(fetchFeaturedPlaylists());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-6 w-48 bg-neutral-800 rounded animate-pulse mb-4" />
        <div className="flex overflow-x-auto gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 min-w-[160px]">
              <SkeletonCard variant="playlist" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-neutral-500 italic mb-8">
        Không thể tải playlist nổi bật
      </p>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Playlist nổi bật</h2>
      <div className="flex overflow-x-auto gap-4">
        {items.map((playlist) => (
          <div key={playlist.id} className="flex-shrink-0 min-w-[160px]">
            <CardEditorialPlaylist playlist={playlist} />
          </div>
        ))}
      </div>
    </div>
  );
}
