import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getSongs } from '../services/SongService';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { getPersonalizedSongs, getTrendingSongs, getNewReleases, getDiscoverMix } from '../services/RecommendationService';
import { getAllAlbums } from '../services/AlbumService';
import CardSong from '../components/cards/CardSong';
import Card from '../components/cards/Card';
import SkeletonCard from '../components/ui/SkeletonCard';
import FeaturedPlaylists from '../components/editorial/FeaturedPlaylists';

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, likedSongs } = useSelector((state) => state.auth);

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [personalizedSongs, setPersonalizedSongs] = useState([]);
  const [discoverSongs, setDiscoverSongs] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        setLoading(true);
        const [songsData, albumsData] = await Promise.all([getSongs(), getAllAlbums()]);
        setSongs(songsData);
        setAlbums(albumsData);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMusic();
  }, []);

  useEffect(() => {
    if (songs.length === 0) return;
    setTrendingSongs(getTrendingSongs(songs));
    setNewReleases(getNewReleases(songs));
    setPersonalizedSongs(getPersonalizedSongs(likedSongs || [], songs));
    setDiscoverSongs(getDiscoverMix(likedSongs || [], songs));
  }, [songs, likedSongs]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    dispatch(setCurrentSong(song));
  };

  const toggleSection = (key) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Section album: horizontal scroll trên mobile, grid trên desktop
  const AlbumSection = ({ title, items }) => {
    if (!items?.length) return null;
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        {/* Mobile: horizontal scroll */}
        <div className="sm:hidden flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((album) => (
            <div key={album.id} className="flex-shrink-0 w-40">
              <Card
                image={album.image_url || album.coverUrl}
                title={album.title || album.name}
                subtitle={album.artist_name || album.artistName || 'Album'}
                onClick={() => navigate(`/album/${album.id}`)}
              />
            </div>
          ))}
        </div>
        {/* Desktop: responsive grid */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.slice(0, 10).map((album) => (
            <Card
              key={album.id}
              image={album.image_url || album.coverUrl}
              title={album.title || album.name}
              subtitle={album.artist_name || album.artistName || 'Album'}
              onClick={() => navigate(`/album/${album.id}`)}
            />
          ))}
        </div>
      </div>
    );
  };

  // Section bài hát: grid trên desktop, horizontal scroll trên mobile
  const Section = ({ title, sectionKey, items }) => {
    if (!items?.length) return null;
    const expanded = expandedSections[sectionKey];
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={() => toggleSection(sectionKey)} className="text-sm font-bold text-[#b3b3b3] hover:text-white transition hidden sm:block">
            {expanded ? 'Thu gọn' : 'Hiện tất cả'}
          </button>
        </div>
        {/* Mobile: horizontal scroll. Desktop: grid */}
        <div className="sm:hidden flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((song) => (
            <div key={song.song_id} className="flex-shrink-0 w-40">
              <CardSong song={song} onPlay={handlePlaySong} />
            </div>
          ))}
        </div>
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {(expanded ? items : items.slice(0, 5)).map((song) => (
            <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />
          ))}
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2].map((s) => (
          <div key={s}>
            <div className="h-6 w-40 bg-neutral-800 rounded animate-pulse mb-4" />
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="sm:hidden flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40"><SkeletonCard /></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="sm:p-3 pt-4 mb-20">
        <FeaturedPlaylists />
        <AlbumSection title="Album nổi bật" items={albums} />
        {isAuthenticated && <Section title="Dành cho bạn" sectionKey="personalized" items={personalizedSongs} />}
        <Section title="Thịnh hành" sectionKey="trending" items={trendingSongs} />
        <Section title="Mới phát hành" sectionKey="newReleases" items={newReleases} />
        {isAuthenticated && <Section title="Khám phá" sectionKey="discover" items={discoverSongs} />}
        {songs.length === 0 && <div className="text-[#b3b3b3] text-center mt-10">Không có bài hát nào.</div>}
      </div>
    </>
  );
}