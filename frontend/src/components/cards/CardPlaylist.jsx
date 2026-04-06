import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';

/**
 * Card for editorial playlists.
 * playlist: { id, name, coverUrl, songCount }
 * navigateTo: optional override path (defaults to /playlists/editorial/:id)
 */
export default function CardPlaylist({ playlist, navigateTo }) {
  const navigate = useNavigate();
  const { id, name, coverUrl, songCount } = playlist;

  return (
    <Card
      image={coverUrl}
      title={name}
      subtitle={`${songCount} bài hát`}
      onClick={() => navigate(navigateTo ?? `/playlists/editorial/${id}`)}
    />
  );
}
