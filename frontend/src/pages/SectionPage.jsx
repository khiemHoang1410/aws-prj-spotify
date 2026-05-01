import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft } from 'lucide-react';
import { getSongs } from '../services/SongService';
import { getAllAlbums } from '../services/AlbumService';
import { fetchTrendingSongs, fetchNewReleases, getPersonalizedSongs, getDiscoverMix } from '../services/RecommendationService';
import { playWithContext } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import CardSong from '../components/cards/CardSong';
import Card from '../components/cards/Card';
import SkeletonCard from '../components/ui/SkeletonCard';

// Map sectionKey → config
const SECTION_CONFIG = {
  trending:     { title: 'Thịnh hành',      type: 'song' },
  newReleases:  { title: 'Mới phát hành',   type: 'song' },
  personalized: { title: 'Dành cho bạn',    type: 'song' },
  discover:     { title: 'Khám phá',        type: 'song' },
  albums:       { title: 'Album nổi bật',   type: 'album' },
  allSongs:     { title: 'Tất cả bài hát',  type: 'song' },
};

export default function SectionPage() {
  const { sectionKey } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, likedSongs } = useSelector((s) => s.auth);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const config = SECTION_CONFIG[sectionKey] || { title: sectionKey, type: 'song' };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        let data = [];
        if (sectionKey === 'trending') {
          data = await fetchTrendingSongs(50);
          if (!data.length) data = await getSongs();
        } else if (sectionKey === 'newReleases') {
          data = await fetchNewReleases(50);
          if (!data.length) data = await getSongs();
        } else if (sectionKey === 'albums') {
          data = await getAllAlbums();
        } else if (sectionKey === 'personalized') {
          const all = await getSongs();
          data = getPersonalizedSongs(likedSongs || [], all);
          if (!data.length) data = all;
        } else if (sectionKey === 'discover') {
          const all = await getSongs();
          data = getDiscoverMix(likedSongs || [], all);
          if (!data.length) data = all;
        } else {
          data = await getSongs();
        }
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [sectionKey]);

  const handlePlay = (song) => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    dispatch(playWithContext({ song, songs: items.filter(i => i.song_id) }));
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white">{config.title}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-neutral-400 text-center mt-20">Không có nội dung.</p>
      ) : config.type === 'album' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((album) => (
            <Card
              key={album.id}
              image={album.image_url || album.coverUrl}
              title={album.title || album.name}
              subtitle={album.artist_name || album.artistName || 'Album'}
              onClick={() => navigate(`/album/${album.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {items.map((song) => (
            <CardSong key={song.song_id} song={song} onPlay={handlePlay} />
          ))}
        </div>
      )}
    </div>
  );
}
