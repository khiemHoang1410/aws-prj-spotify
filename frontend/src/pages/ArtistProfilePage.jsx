import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Clock, BadgeCheck, UserPlus, UserCheck } from 'lucide-react';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { getArtistById, followArtist, getRelatedArtists, getFollowedArtists, getArtistTopTracks } from '../services/ArtistService';
import { getAlbumsByArtist, getAllAlbums } from '../services/AlbumService';
import EmptyState from '../components/ui/EmptyState';
import SkeletonCard from '../components/ui/SkeletonCard';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ArtistProfilePage() {
  const dispatch = useDispatch();
  const { id: activeArtistId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Ẩn nút follow nếu đây là trang nghệ sĩ của chính mình
  const isOwnProfile = !!(user?.artist_id && user.artist_id === activeArtistId);

  const [artist, setArtist] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [artistSongs, setArtistSongs] = useState([]);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [relatedArtists, setRelatedArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeArtistId) return;
    setIsLoading(true);
    setError(null);
    Promise.all([
      getArtistById(activeArtistId),
      getArtistTopTracks(activeArtistId),
      isAuthenticated ? getFollowedArtists() : Promise.resolve([]),
    ]).then(([artistData, topTracks, followedArtists]) => {
      if (!artistData) { setError('Không tìm thấy nghệ sĩ.'); return; }
      setArtist(artistData);
      setFollowerCount(artistData.followers ?? 0);
      setArtistSongs(topTracks);
      setIsFollowing(followedArtists.some((a) => a.id === activeArtistId));
      // Load albums và related artists song song sau khi có artistData
      getAllAlbums().then((albums) => {
        setArtistAlbums(albums.filter((a) => a.artist_id === activeArtistId));
      });
      getRelatedArtists(activeArtistId).then((related) => setRelatedArtists(related));
    }).catch(() => {
      setError('Không thể tải thông tin nghệ sĩ. Vui lòng thử lại.');
    }).finally(() => setIsLoading(false));
  }, [activeArtistId, isAuthenticated]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    dispatch(setCurrentSong(song));
  };

  const handlePlayAll = () => {
    if (artistSongs.length > 0) handlePlaySong(artistSongs[0]);
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }
    const wasFollowing = isFollowing;
    // Optimistic update
    setIsFollowing(!wasFollowing);
    setFollowerCount((prev) => wasFollowing ? Math.max(0, prev - 1) : prev + 1);
    await followArtist(activeArtistId);
    dispatch(showToast({
      message: wasFollowing ? 'Đã huỷ theo dõi' : 'Đã theo dõi nghệ sĩ',
      type: 'success',
    }));
  };

  if (!activeArtistId) return null;

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
        <SkeletonCard variant="row" />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="mt-10 text-center text-neutral-400">
        {error || 'Không tìm thấy nghệ sĩ.'}
      </div>
    );
  }

  return (
    <div>
      {/* Hero section */}
      <div
        className="relative flex items-end gap-6 h-72 px-6 pb-6 mb-6 -mx-6 -mt-6 bg-cover bg-center"
        style={{
          backgroundImage: artist.artist_background
            ? `url(${artist.artist_background})`
            : undefined,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#121212]" />
        <div className="relative z-10 flex items-end gap-6">
          <img
            src={artist.photo_url || artist.image_url}
            alt={artist.name}
            className="w-48 h-48 rounded-full object-cover shadow-2xl ring-4 ring-neutral-800 flex-shrink-0"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
          />
          <div className="min-w-0">
            {artist.isVerified && (
              <div className="flex items-center gap-1 text-blue-400 text-xs font-semibold mb-1">
                <BadgeCheck size={16} />
                <span>Nghệ sĩ được xác minh</span>
              </div>
            )}
            <h1 className="text-5xl font-extrabold text-white mb-2">{artist.name}</h1>
            <p className="text-sm text-neutral-300">
              {artist.monthly_listeners} người nghe hàng tháng • {followerCount.toLocaleString()} người theo dõi
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayAll}
          disabled={artistSongs.length === 0}
          className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition shadow-lg disabled:opacity-50"
        >
          <Play size={24} className="text-black fill-black ml-1" />
        </button>
        {/* Ẩn nút theo dõi nếu đây là trang nghệ sĩ của chính mình */}
        {!isOwnProfile && (
          <button
            onClick={handleFollow}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
              isFollowing
                ? 'border border-green-500 text-green-500 hover:border-green-400'
                : 'border border-neutral-600 text-white hover:border-white'
            }`}
          >
            {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
        )}
      </div>

      {/* Bio */}
      {artist.bio && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-2">Giới thiệu</h3>
          <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">{artist.bio}</p>
        </div>
      )}

      {/* Popular songs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Bài hát phổ biến</h3>
        {artistSongs.length > 0 ? (
          <>
            <div className="grid grid-cols-[24px_1fr_1fr_56px] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
              <span>#</span>
              <span>Tiêu đề</span>
              <span>Album</span>
              <span className="flex justify-center"><Clock size={14} /></span>
            </div>
            <div className="flex flex-col">
              {artistSongs.map((song, idx) => (
                <div
                  key={song.song_id}
                  className="grid grid-cols-[24px_1fr_1fr_56px] gap-4 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition"
                  onClick={() => handlePlaySong(song)}
                >
                  <span className="text-sm text-neutral-400 flex items-center group-hover:hidden">{idx + 1}</span>
                  <Play
                    size={16}
                    className="text-white hidden group-hover:flex items-center fill-white cursor-pointer"
                  />
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.image_url}
                      alt={song.title}
                      className="w-10 h-10 rounded object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                    />
                    <span className="text-sm font-medium text-white truncate">{song.title}</span>
                  </div>
                  <span className="text-sm text-neutral-400 flex items-center truncate">
                    {artistAlbums.find((a) => a.id === song.album_id)?.title || song.album_name || '—'}
                  </span>
                  <span className="text-sm text-neutral-400 flex items-center justify-center">{formatDuration(song.duration)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState icon={Play} title="Chưa có bài hát" description="Nghệ sĩ này chưa có bài hát nào trên hệ thống." />
        )}
      </div>

      {/* [S8-007.5] Albums section */}
      {artistAlbums.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-3">Albums</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-700">
            {artistAlbums.map((album) => (
              <div
                key={album.id}
                className="flex-shrink-0 w-40 cursor-pointer group"
                onClick={() => navigate(`/album/${album.id}`)}
              >
                <img
                  src={album.image_url || IMG_FALLBACK}
                  alt={album.title}
                  className="w-40 h-40 rounded-lg object-cover shadow-lg group-hover:opacity-80 transition"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                />
                <p className="text-sm font-medium text-white mt-2 truncate">{album.title}</p>
                <p className="text-xs text-neutral-400">{album.release_date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Related Artists */}
      {relatedArtists.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-3">Nghệ sĩ tương tự</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-700">
            {relatedArtists.map((a) => (
              <div
                key={a.id}
                className="flex-shrink-0 w-36 cursor-pointer group text-center"
                onClick={() => navigate(`/artist/${a.id}`)}
              >
                {a.photo_url || a.image_url ? (
                  <img
                    src={a.photo_url || a.image_url}
                    alt={a.name}
                    className="w-36 h-36 rounded-full object-cover shadow-lg group-hover:opacity-80 transition mx-auto"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div
                  className="w-36 h-36 rounded-full shadow-lg mx-auto items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 group-hover:opacity-80 transition"
                  style={{ display: (a.photo_url || a.image_url) ? 'none' : 'flex' }}
                >
                  <span className="text-white text-4xl font-bold">{a.name?.[0]?.toUpperCase()}</span>
                </div>
                <p className="text-sm font-medium text-white mt-2 truncate">{a.name}</p>
                <p className="text-xs text-neutral-400">Nghệ sĩ</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
