import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getSongs } from '../services/SongService';
import { playWithContext } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { getPersonalizedSongs, getDiscoverMix, fetchTrendingSongs, fetchNewReleases } from '../services/RecommendationService';
import { getAllAlbums } from '../services/AlbumService';
import CardSong from '../components/cards/CardSong';
import Card from '../components/cards/Card';
import SkeletonCard from '../components/ui/SkeletonCard';
import SectionRow from '../components/ui/SectionRow';
import FeaturedPlaylists from '../components/editorial/FeaturedPlaylists';
import PageFooter from '../components/layout/PageFooter';

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

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        setLoading(true);
        const [songsData, albumsData, trendingData, newReleasesData] = await Promise.all([
          getSongs(),
          getAllAlbums(),
          fetchTrendingSongs(12),
          fetchNewReleases(12),
        ]);
        setSongs(songsData);
        setAlbums(albumsData);
        setTrendingSongs(trendingData.length > 0 ? trendingData : songsData.slice(0, 12));
        setNewReleases(newReleasesData.length > 0 ? newReleasesData : songsData.slice(0, 12));
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
    setPersonalizedSongs(getPersonalizedSongs(likedSongs || [], songs));
    setDiscoverSongs(getDiscoverMix(likedSongs || [], songs));
  }, [songs, likedSongs]);

  const handlePlaySong = (song, contextSongs) => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    dispatch(playWithContext({ song, songs: contextSongs || [] }));
  };

  if (loading) {
    return (
      <div className="space-y-10 pb-24">
        {[1, 2, 3].map((s) => (
          <div key={s}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-7 w-44 bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 w-20 bg-neutral-800 rounded animate-pulse" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[180px]"><SkeletonCard /></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="sm:p-3 pt-4 pb-24">
        {/* Editorial playlists */}
        <FeaturedPlaylists />

        {/* Albums nổi bật */}
        {albums.length > 0 && (
          <SectionRow title="Album nổi bật" sectionKey="albums">
            {albums.slice(0, 12).map((album) => (
              <Card
                key={album.id}
                image={album.image_url || album.coverUrl}
                title={album.title || album.name}
                subtitle={album.artist_name || album.artistName || 'Album'}
                onClick={() => navigate(`/album/${album.id}`)}
              />
            ))}
          </SectionRow>
        )}

        {/* Dành cho bạn — chỉ khi đăng nhập */}
        {isAuthenticated && personalizedSongs.length > 0 && (
          <SectionRow title="Dành cho bạn" sectionKey="personalized">
            {personalizedSongs.slice(0, 12).map((song) => (
              <CardSong key={song.song_id} song={song} onPlay={(s) => handlePlaySong(s, personalizedSongs)} />
            ))}
          </SectionRow>
        )}

        {/* Thịnh hành */}
        {trendingSongs.length > 0 && (
          <SectionRow title="Thịnh hành" sectionKey="trending">
            {trendingSongs.slice(0, 12).map((song) => (
              <CardSong key={song.song_id} song={song} onPlay={(s) => handlePlaySong(s, trendingSongs)} />
            ))}
          </SectionRow>
        )}

        {/* Mới phát hành */}
        {newReleases.length > 0 && (
          <SectionRow title="Mới phát hành" sectionKey="newReleases">
            {newReleases.slice(0, 12).map((song) => (
              <CardSong key={song.song_id} song={song} onPlay={(s) => handlePlaySong(s, newReleases)} />
            ))}
          </SectionRow>
        )}

        {/* Khám phá — chỉ khi đăng nhập */}
        {isAuthenticated && discoverSongs.length > 0 && (
          <SectionRow title="Khám phá" sectionKey="discover">
            {discoverSongs.slice(0, 12).map((song) => (
              <CardSong key={song.song_id} song={song} onPlay={(s) => handlePlaySong(s, discoverSongs)} />
            ))}
          </SectionRow>
        )}

        {/* Tất cả bài hát */}
        {songs.length > 0 && (
          <SectionRow title="Tất cả bài hát" sectionKey="allSongs">
            {songs.slice(0, 12).map((song) => (
              <CardSong key={song.song_id} song={song} onPlay={(s) => handlePlaySong(s, songs)} />
            ))}
          </SectionRow>
        )}

        {songs.length === 0 && !loading && (
          <div className="text-[#b3b3b3] text-center mt-10">Không có bài hát nào.</div>
        )}
      </div>
      <PageFooter />
    </>
  );
}
