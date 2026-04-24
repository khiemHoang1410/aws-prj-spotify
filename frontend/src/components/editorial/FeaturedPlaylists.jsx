import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchFeaturedPlaylists,
  selectFeaturedPlaylists,
  selectFeaturedLoading,
} from '../../store/editorialSlice';
import Card from '../cards/Card';
import SkeletonCard from '../ui/SkeletonCard';

/**
 * "Playlist nổi bật" — chỉ hiển thị editorial playlists (do admin tạo).
 * Albums được render riêng trong "Album nổi bật" ở HomePage.
 */
export default function FeaturedPlaylists() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const playlists = useSelector(selectFeaturedPlaylists);
  const loading = useSelector(selectFeaturedLoading);

  useEffect(() => {
    dispatch(fetchFeaturedPlaylists());
  }, [dispatch]);

  const items = (playlists || []).map((p) => ({
    id: p.id,
    image: p.coverUrl || null,
    title: p.name,
    subtitle: p.songCount != null ? `${p.songCount} bài hát` : 'Playlist',
    onClick: () => navigate(`/playlists/editorial/${p.id}`),
  }));

  if (loading && items.length === 0) {
    return (
      <div className="mb-8">
        <div className="h-6 w-48 bg-neutral-800 rounded animate-pulse mb-4" />
        {/* Mobile skeleton: horizontal scroll */}
        <div className="sm:hidden flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40"><SkeletonCard /></div>
          ))}
        </div>
        {/* Desktop skeleton: grid */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">Playlist nổi bật</h2>
      {/* Mobile: horizontal scroll */}
      <div className="sm:hidden flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-40">
            <Card
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              onClick={item.onClick}
            />
          </div>
        ))}
      </div>

      {/* Desktop: responsive grid */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {items.map((item) => (
          <Card
            key={item.id}
            image={item.image}
            title={item.title}
            subtitle={item.subtitle}
            onClick={item.onClick}
          />
        ))}
      </div>
    </div>
  );
}
