import React from 'react';
import Card from './Card';

export default function CardArtist({ artist, onClick }) {
  return (
    <Card
      image={artist.image_url || artist.photo_url}
      title={artist.name}
      subtitle="Nghệ sĩ"
      onClick={onClick}
      imageShape="circle"
    />
  );
}
