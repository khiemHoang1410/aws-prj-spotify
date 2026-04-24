import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Music, Headphones, Users, TrendingUp,
  Play, Clock, Pencil, Trash2, PlusCircle, Disc3, X,
  Image as ImageIcon, Calendar, CheckSquare, Square,
} from 'lucide-react';
import { showToast } from '../store/uiSlice';
import { setCurrentSong } from '../store/playerSlice';
import { openModal } from '../store/authSlice';
import { ROLES } from '../constants/enums';
import { getArtistById, getArtistByUserId } from '../services/ArtistService';
import { getArtistProfileFromStorage } from '../services/AuthService';
import { getSongs, deleteSong } from '../services/SongService';
import {
  getAllAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumSongs,
  addSongToAlbum,
  removeSongFromAlbum,
} from '../services/AlbumService';

const IMG_FALLBACK = '/pictures/whiteBackground.jpg';

const STAT_CARDS = [
  { key: 'totalSongs',      label: 'Tß╗òng b├ái h├ít',    icon: Music,      color: 'text-blue-400' },
  { key: 'totalPlays',      label: 'Tß╗òng l╞░ß╗út nghe',  icon: Headphones, color: 'text-green-400' },
  { key: 'followers',       label: 'Ng╞░ß╗¥i theo d├╡i',  icon: Users,      color: 'text-purple-400' },
  { key: 'monthlyListeners',label: 'L╞░ß╗út nghe th├íng', icon: TrendingUp, color: 'text-yellow-400' },
];

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ΓöÇΓöÇΓöÇ Album Modal ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function AlbumModal({ mode, album, artistSongs, onClose, onSaved }) {
  const dispatch = useDispatch();

  const [title, setTitle]           = useState(album?.title || '');
  const [coverUrl, setCoverUrl]     = useState(album?.image_url || album?.coverUrl || '');
  const [releaseDate, setReleaseDate] = useState(
    album?.release_date ? album.release_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving]         = useState(false);

  // Song management (chß╗ë khi edit ΓÇö sau khi album ─æ├ú tß╗ôn tß║íi)
  const [albumSongIds, setAlbumSongIds] = useState(new Set());
  const [songLoading, setSongLoading]   = useState(false);
  const [togglingId, setTogglingId]     = useState(null);

  // Saved album id (─æß╗â add/remove songs sau khi create)
  const [savedAlbumId, setSavedAlbumId] = useState(album?.id || null);
  const [phase, setPhase]               = useState(mode === 'edit' ? 'details' : 'details');
  // phase: 'details' | 'songs'

  // Load songs hiß╗çn tß║íi cß╗ºa album (khi edit)
  useEffect(() => {
    if (!savedAlbumId) return;
    setSongLoading(true);
    getAlbumSongs(savedAlbumId)
      .then((songs) => setAlbumSongIds(new Set(songs.map((s) => s.song_id))))
      .finally(() => setSongLoading(false));
  }, [savedAlbumId]);

  const handleSaveDetails = async () => {
    if (!title.trim()) {
      dispatch(showToast({ message: 'T├¬n album kh├┤ng ─æ╞░ß╗úc trß╗æng', type: 'error' }));
      return;
    }
    setSaving(true);
    try {
      if (mode === 'create') {
        const result = await createAlbum({
          title: title.trim(),
          coverUrl: coverUrl.trim() || undefined,
          releaseDate: releaseDate || undefined,
        });
        if (!result.success || !result.data?.id) {
          dispatch(showToast({ message: 'Tß║ío album thß║Ñt bß║íi', type: 'error' }));
          return;
        }
        setSavedAlbumId(result.data.id);
        setPhase('songs');
        dispatch(showToast({ message: '─É├ú tß║ío album ΓÇö chß╗ìn b├ái h├ít b├¬n d╞░ß╗¢i', type: 'success' }));
      } else {
        await updateAlbum(savedAlbumId, {
          title: title.trim(),
          coverUrl: coverUrl.trim() || undefined,
          releaseDate: releaseDate || undefined,
        });
        dispatch(showToast({ message: '─É├ú cß║¡p nhß║¡t album', type: 'success' }));
        setPhase('songs');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSong = async (song) => {
    if (!savedAlbumId || togglingId) return;
    const songId = song.song_id;
    setTogglingId(songId);
    const isInAlbum = albumSongIds.has(songId);
    try {
      if (isInAlbum) {
        const res = await removeSongFromAlbum(savedAlbumId, songId);
        if (res.success) setAlbumSongIds((prev) => { const s = new Set(prev); s.delete(songId); return s; });
        else dispatch(showToast({ message: 'Kh├┤ng thß╗â xo├í b├ái h├ít', type: 'error' }));
      } else {
        const res = await addSongToAlbum(savedAlbumId, songId);
        if (res.success) setAlbumSongIds((prev) => new Set([...prev, songId]));
        else dispatch(showToast({ message: 'Kh├┤ng thß╗â th├¬m b├ái h├ít', type: 'error' }));
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDone = () => {
    onSaved(savedAlbumId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1a1a1a] rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-lg font-bold text-white">
            {mode === 'create' ? 'Tß║ío album mß╗¢i' : `Chß╗ënh sß╗¡a: ${album?.title}`}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Phase tabs */}
        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => setPhase('details')}
            className={`flex-1 py-2 text-sm font-semibold transition ${
              phase === 'details' ? 'text-green-400 border-b-2 border-green-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Th├┤ng tin
          </button>
          <button
            onClick={() => savedAlbumId && setPhase('songs')}
            disabled={!savedAlbumId}
            className={`flex-1 py-2 text-sm font-semibold transition ${
              phase === 'songs' ? 'text-green-400 border-b-2 border-green-400' : 'text-neutral-400 hover:text-white'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            B├ái h├ít ({albumSongIds.size})
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {phase === 'details' && (
            <div className="flex flex-col gap-4">
              {/* Title */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 block">
                  T├¬n album <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Nhß╗»ng b├ái h├ít hay nhß║Ñt"
                  className="w-full bg-neutral-800 text-white text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveDetails()}
                />
              </div>

              {/* Cover URL */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 flex items-center gap-1">
                  <ImageIcon size={12} /> ß║ónh b├¼a (URL, tuß╗│ chß╗ìn)
                </label>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-neutral-800 text-white text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                />
                {coverUrl && (
                  <img
                    src={coverUrl}
                    alt="preview"
                    className="mt-2 w-20 h-20 object-cover rounded"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>

              {/* Release date */}
              <div>
                <label className="text-xs text-neutral-400 font-semibold mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Ng├áy ph├ít h├ánh (tuß╗│ chß╗ìn)
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full bg-neutral-800 text-white text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Save details */}
              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="mt-2 w-full py-2 rounded-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-bold transition"
              >
                {saving ? '─Éang l╞░u...' : mode === 'create' ? 'Tß║ío album & chß╗ìn b├ái h├ít ΓåÆ' : 'L╞░u & quß║ún l├╜ b├ái h├ít ΓåÆ'}
              </button>
            </div>
          )}

          {phase === 'songs' && (
            <div>
              <p className="text-xs text-neutral-400 mb-3">
                Chß╗ìn b├ái h├ít cß╗ºa bß║ín ─æß╗â th├¬m v├áo album. Thay ─æß╗òi ─æ╞░ß╗úc ├íp dß╗Ñng ngay.
              </p>
              {songLoading ? (
                <div className="text-center text-neutral-400 text-sm py-6">─Éang tß║úi...</div>
              ) : artistSongs.length === 0 ? (
                <div className="text-center text-neutral-400 text-sm py-6">Bß║ín ch╞░a c├│ b├ái h├ít n├áo.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {artistSongs.map((song) => {
                    const inAlbum = albumSongIds.has(song.song_id);
                    const toggling = togglingId === song.song_id;
                    return (
                      <button
                        key={song.song_id}
                        onClick={() => handleToggleSong(song)}
                        disabled={!!togglingId}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition w-full text-left ${
                          inAlbum ? 'bg-green-500/10 hover:bg-green-500/20' : 'hover:bg-white/5'
                        } disabled:opacity-60`}
                      >
                        <div className="flex-shrink-0 text-green-400">
                          {toggling ? (
                            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                          ) : inAlbum ? (
                            <CheckSquare size={18} />
                          ) : (
                            <Square size={18} className="text-neutral-500" />
                          )}
                        </div>
                        <img
                          src={song.image_url || IMG_FALLBACK}
                          alt={song.title}
                          className="w-9 h-9 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate font-medium">{song.title}</p>
                          <p className="text-xs text-neutral-400 truncate">{formatDuration(song.duration)}</p>
                        </div>
                        {inAlbum && (
                          <span className="text-xs text-green-400 font-semibold flex-shrink-0">Trong album</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-neutral-600 text-white text-sm font-semibold hover:border-white transition"
          >
            ─É├│ng
          </button>
          {phase === 'songs' && (
            <button
              onClick={handleDone}
              className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black text-sm font-bold transition"
            >
              Xong Γ£ô
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Main Page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export default function ArtistDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [stats, setStats]     = useState(null);
  const [mySongs, setMySongs] = useState([]);
  const [myAlbums, setMyAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', album?: {...} }

  const openCreateModal = () => setModal({ mode: 'create', album: null });
  const openEditModal   = (album) => setModal({ mode: 'edit', album });
  const closeModal      = () => setModal(null);

  const refreshAlbums = useCallback(async (artistId) => {
    const rawAlbums = await getAllAlbums();
    const albums = (Array.isArray(rawAlbums) ? rawAlbums : []).filter((a) => a.artist_id === artistId);
    const songsByArtist = mySongs; // already loaded
    const albumsWithCount = albums.map((a) => ({
      ...a,
      songCount: songsByArtist.filter((s) => s.album_id === a.id).length,
    }));
    setMyAlbums(albumsWithCount);
  }, [mySongs]);

  useEffect(() => {
    if (!user || user.role !== ROLES.ARTIST) { navigate('/'); return; }
    setIsLoading(true);

    const resolveArtistProfile = async () => {
      const userId = user.user_id || user.id;

      // 1. Thß╗¡ gß╗ìi API trß╗▒c tiß║┐p bß║▒ng artist_id (fast path)
      if (user.artist_id) {
        const p = await getArtistById(user.artist_id);
        if (p) return p;
      }

      // 2. API 503/lß╗ùi ΓÇö d├╣ng localStorage cache (l╞░u khi login th├ánh c├┤ng tr╞░ß╗¢c ─æ├│)
      const cached = getArtistProfileFromStorage(userId);
      if (cached?.id) return cached;

      // 3. Thß╗¡ query theo userId (tr╞░ß╗¥ng hß╗úp artist_id ch╞░a c├│ trong Redux)
      return getArtistByUserId(userId);
    };

    resolveArtistProfile().then((artistProfile) => {
      const artistId = artistProfile?.id || null;
      if (!artistId) {
        dispatch(showToast({ message: 'Kh├┤ng t├¼m thß║Ñy hß╗ô s╞í nghß╗ç s─⌐. Vui l├▓ng x├íc minh lß║íi.', type: 'warning' }));
        navigate('/artist-verify');
        setIsLoading(false);
        return;
      }
      Promise.all([
        Promise.resolve(artistProfile),
        getSongs(),
        getAllAlbums(),
      ]).then(([profile, allSongs, rawAlbums]) => {
        const albums = (Array.isArray(rawAlbums) ? rawAlbums : []).filter((a) => a.artist_id === artistId);
        const songsByArtist = (Array.isArray(allSongs) ? allSongs : []).filter((s) => s.artist_id === artistId);
        const totalPlays = songsByArtist.reduce((sum, s) => sum + (s.play_count || 0), 0);
        const albumsWithCount = albums.map((a) => ({
          ...a,
          songCount: songsByArtist.filter((s) => s.album_id === a.id).length,
        }));
        setStats({
          totalSongs: songsByArtist.length,
          totalAlbums: albumsWithCount.length,
          totalPlays,
          followers: profile?.followers || 0,
          monthlyListeners: Number(profile?.monthly_listeners) || 0,
        });
        setMySongs(songsByArtist);
        setMyAlbums(albumsWithCount);
      }).finally(() => setIsLoading(false));
    });
  }, [user, dispatch]);

  const handlePlaySong = (song) => {
    if (!isAuthenticated) { dispatch(openModal('login')); return; }
    dispatch(setCurrentSong(song));
  };
  const handleEditSong   = (song) => navigate(`/edit-song/${song.song_id}`);
  const handleDeleteSong = async (songId) => {
    if (!window.confirm('Bß║ín c├│ chß║»c muß╗æn xo├í b├ái h├ít n├áy?')) return;
    const result = await deleteSong(songId);
    if (result.success) {
      setMySongs((prev) => prev.filter((s) => s.song_id !== songId));
      dispatch(showToast({ message: '─É├ú xo├í b├ái h├ít', type: 'success' }));
    }
  };
  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm('Bß║ín c├│ chß║»c muß╗æn xo├í album n├áy?')) return;
    const result = await deleteAlbum(albumId);
    if (result.success) {
      setMyAlbums((prev) => prev.filter((a) => a.id !== albumId));
      dispatch(showToast({ message: '─É├ú xo├í album', type: 'success' }));
    }
  };

  // Gß╗ìi sau khi modal l╞░u xong ΓåÆ refresh danh s├ích album
  const handleModalSaved = async (savedAlbumId) => {
    const artistId = user?.artist_id;
    if (!artistId) return;
    const rawAlbums = await getAllAlbums();
    const albums = (Array.isArray(rawAlbums) ? rawAlbums : []).filter((a) => a.artist_id === artistId);
    setMyAlbums(albums.map((a) => ({
      ...a,
      songCount: mySongs.filter((s) => s.album_id === a.id).length,
    })));
  };

  if (!user || user.role !== ROLES.ARTIST) return null;

  return (
    <div>
      {/* Album modal */}
      {modal && (
        <AlbumModal
          mode={modal.mode}
          album={modal.album}
          artistSongs={mySongs}
          onClose={closeModal}
          onSaved={handleModalSaved}
        />
      )}

      <h1 className="text-xl font-bold text-white mb-6">Thß╗æng k├¬ nghß╗ç s─⌐</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="bg-neutral-800 rounded-xl p-5 flex items-center gap-4">
            <div className={color}><Icon size={28} /></div>
            <div>
              <p className="text-2xl font-bold text-white">
                {isLoading ? 'ΓÇö' : (stats?.[key]?.toLocaleString?.() ?? stats?.[key] ?? 'ΓÇö')}
              </p>
              <p className="text-sm text-neutral-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My songs table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">B├ái h├ít cß╗ºa t├┤i</h2>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition"
        >
          <PlusCircle size={16} /> Th├¬m b├ái h├ít
        </button>
      </div>

      {mySongs.length > 0 ? (
        <>
          <div className="grid grid-cols-[24px_1fr_1fr_56px_80px] gap-4 px-4 py-2 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800 mb-1">
            <span>#</span><span>Ti├¬u ─æß╗ü</span><span>Thß╗â loß║íi</span>
            <span className="flex justify-center"><Clock size={14} /></span>
            <span className="text-center">Thao t├íc</span>
          </div>
          <div className="flex flex-col">
            {mySongs.map((song, idx) => (
              <div
                key={song.song_id}
                className="grid grid-cols-[24px_1fr_1fr_56px_80px] gap-4 px-4 py-2 rounded-md hover:bg-white/5 cursor-pointer group transition"
                onClick={() => handlePlaySong(song)}
              >
                <span className="text-sm text-neutral-400 flex items-center group-hover:hidden">{idx + 1}</span>
                <Play size={16} className="text-white hidden group-hover:flex items-center fill-white cursor-pointer" />
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={song.image_url} alt={song.title}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                  />
                  <span className="text-sm font-medium text-white truncate">{song.title}</span>
                </div>
                <span className="text-sm text-neutral-400 flex items-center truncate">
                  {song.categories?.join(', ') || 'ΓÇö'}
                </span>
                <span className="text-sm text-neutral-400 flex items-center justify-center">{formatDuration(song.duration)}</span>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleEditSong(song); }} className="text-neutral-400 hover:text-white transition" title="Chß╗ënh sß╗¡a">
                    <Pencil size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSong(song.song_id); }} className="text-neutral-400 hover:text-red-400 transition" title="Xo├í">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-neutral-400 text-sm mt-4">
          {isLoading ? '─Éang tß║úi...' : 'Bß║ín ch╞░a c├│ b├ái h├ít n├áo tr├¬n hß╗ç thß╗æng.'}
        </div>
      )}

      {/* Albums section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Albums</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition"
          >
            <PlusCircle size={16} /> Tß║ío album mß╗¢i
          </button>
        </div>

        {myAlbums.length > 0 ? (
          <div className="flex flex-col gap-1">
            {myAlbums.map((album) => (
              <div
                key={album.id}
                className="flex items-center gap-4 px-4 py-3 rounded-md hover:bg-white/5 cursor-pointer group transition"
                onClick={() => navigate(`/album/${album.id}`)}
              >
                <img
                  src={album.image_url || IMG_FALLBACK}
                  alt={album.title}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMG_FALLBACK; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{album.title}</p>
                  <p className="text-xs text-neutral-400">{album.songCount ?? 0} b├ái h├ít ΓÇó {album.release_date || 'ΓÇö'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Chß╗ë Pencil mß╗¢i mß╗ƒ edit modal */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(album); }}
                    className="text-neutral-400 hover:text-white transition"
                    title="Chß╗ënh sß╗¡a album"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                    className="text-neutral-400 hover:text-red-400 transition"
                    title="Xo├í album"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-neutral-400 text-sm mt-2">
            {isLoading ? '─Éang tß║úi...' : 'Bß║ín ch╞░a c├│ album n├áo.'}
          </div>
        )}
      </div>
    </div>
  );
}
