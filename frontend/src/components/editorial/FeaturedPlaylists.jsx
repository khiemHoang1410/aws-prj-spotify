import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFeaturedPlaylists,
  selectFeaturedPlaylists,
  selectFeaturedLoading,
  selectFeaturedError,
} from '../../store/editorialSlice';
import CardPlaylist from '../cards/CardPlaylist';
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
        <div className="grid grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
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
      <div className="grid grid-cols-5 gap-6">
        {items.map((playlist) => (
          <CardPlaylist key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </div>
  );
}
