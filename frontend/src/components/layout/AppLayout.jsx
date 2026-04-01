import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, updateSessionUser } from '../../services/AuthService';
import { closeModal, loginSuccess, setLikedSongs } from '../../store/authSlice';
import { getProfile } from '../../services/UserService';
import { getLikedSongs } from '../../services/PlaylistService';
import { setCurrentSong } from '../../store/playerSlice';
import { getSongById } from '../../services/SongService';
import { showToast } from '../../store/uiSlice';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PlayerBar from './PlayerBar';
import QueueSidebar from './QueueSidebar';
import ReportModal from '../modals/ReportModal';
import Toast from '../ui/Toast';
import MiniLyricsPanel from '../Lyrics/MiniLyricsPanel';
import ErrorBoundary from '../ui/ErrorBoundary';

const rolePriority = (role) => {
  if (role === 'admin') return 3;
  if (role === 'artist') return 2;
  return 1;
};

const mergeUserRoleSafely = (cachedUser, freshUser) => {
  if (!cachedUser) return freshUser;
  if (!freshUser) return cachedUser;

  // Không cho phép role bị tụt do dữ liệu backend stale sau khi approve
  const chosenRole = rolePriority(freshUser.role) >= rolePriority(cachedUser.role)
    ? freshUser.role
    : cachedUser.role;

  return { ...freshUser, role: chosenRole };
};

const isSameUserSnapshot = (leftUser, rightUser) => {
  if (!leftUser && !rightUser) return true;
  if (!leftUser || !rightUser) return false;
  return leftUser.user_id === rightUser.user_id
    && leftUser.role === rightUser.role
    && leftUser.username === rightUser.username
    && leftUser.name === rightUser.name
    && leftUser.email === rightUser.email
    && leftUser.avatar_url === rightUser.avatar_url;
};

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPiP, isReportModalOpen } = useSelector((state) => state.ui);
  const { currentSong } = useSelector((state) => state.player);
  const { user: authUser, isModalOpen, modalType } = useSelector((state) => state.auth);
  const location = useLocation();

  const isLyricsPage = location.pathname === '/lyrics';

  const syncUserFromBackend = async (cachedUser) => {
    if (!import.meta.env.VITE_API_URL || !cachedUser) return;
    try {
      const freshUser = await getProfile();
      if (freshUser) {
        const mergedUser = mergeUserRoleSafely(cachedUser, freshUser);
        if (!isSameUserSnapshot(cachedUser, mergedUser)) {
          updateSessionUser(mergedUser);
          dispatch(loginSuccess(mergedUser));
        }
      }
    } catch { /* Backend không khả dụng — giữ data cache */ }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      // Dispatch ngay với dữ liệu cache để UI hiển thị sớm
      dispatch(loginSuccess(user));

      // Restore liked songs từ localStorage theo từng user
      try {
        const raw = localStorage.getItem(`spotify_liked_${user.user_id}`);
        if (raw) {
          const liked = JSON.parse(raw);
          if (Array.isArray(liked)) dispatch(setLikedSongs(liked));
        }
      } catch { /* ignore */ }

      // Refresh profile + liked songs từ backend
      if (!import.meta.env.VITE_API_URL) return;
      try {
        const freshUser = await getProfile();
        if (freshUser?.user_id) {
          const mergedUser = mergeUserRoleSafely(user, freshUser);
          updateSessionUser(mergedUser);
          dispatch(loginSuccess(mergedUser));
        }

        const likedFromBackend = await getLikedSongs({ ensureExists: false });
        if (Array.isArray(likedFromBackend)) {
          dispatch(setLikedSongs(likedFromBackend));
        }
      } catch { /* ignore */ }

      // Refresh user profile từ backend để cập nhật role + artistId mới nhất
      await syncUserFromBackend(user);
    };
    restoreSession();
  }, [dispatch]);

  useEffect(() => {
    if (!authUser || authUser.role === 'artist' || authUser.role === 'admin') return undefined;

    const interval = setInterval(async () => {
      const user = await getCurrentUser();
      if (!user) return;
      await syncUserFromBackend(user);
    }, 15000);

    return () => clearInterval(interval);
  }, [authUser]);

  // Handle song share link: ?song=xxx
  useEffect(() => {
    const songId = searchParams.get('song');
    if (!songId) return;

    (async () => {
      try {
        const song = await getSongById(songId);
        if (song) {
          dispatch(setCurrentSong(song));
        } else {
          dispatch(showToast({ message: 'Không tìm thấy bài hát', type: 'error' }));
        }
      } catch (err) {
        console.error('[AppLayout] Error loading shared song:', err);
        dispatch(showToast({ message: 'Lỗi tải bài hát chia sẻ', type: 'error' }));
      }
    })();
  }, [searchParams, dispatch]);

  // Bridge compatibility: các nơi cũ còn dispatch openModal('login'|'register')
  useEffect(() => {
    if (!isModalOpen) return;

    const targetPath = modalType === 'register' ? '/register' : '/login';
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    dispatch(closeModal());
  }, [isModalOpen, modalType, location.pathname, navigate, dispatch]);

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white overflow-hidden font-sans">
      <div className="flex-1 flex overflow-hidden">
        {!isLyricsPage && (
          <aside className="w-64 bg-black flex-shrink-0 flex flex-col">
            <Sidebar />
          </aside>
        )}

        <main className={`flex-1 bg-[#121212] rounded-lg mt-2 mr-2 mb-2 overflow-y-auto relative ${isLyricsPage ? 'ml-2' : ''}`}>
          <div className="p-6 min-h-full bg-gradient-to-b from-[#1f1f1f] to-[#121212] relative overflow-x-hidden">
            <Navbar />
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        <QueueSidebar />
      </div>

      <footer className="h-24 bg-black flex-shrink-0 border-t border-[#282828] z-50">
        <PlayerBar />
      </footer>

      <Toast />
      {isPiP && currentSong && <MiniLyricsPanel />}
      {isReportModalOpen && <ReportModal />}
    </div>
  );
}
