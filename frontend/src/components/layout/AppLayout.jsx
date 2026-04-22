import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from '../../services/AuthService';
import { loginSuccess, setLikedSongs } from '../../store/authSlice';
import { getProfile } from '../../services/UserService';
import { getLikedSongs } from '../../services/SongService';
import api from '../../services/apiClient';
import { adaptUser } from '../../services/adapters';
import { checkAndSaveArtistProfile } from '../../services/AuthService';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PlayerBar from './PlayerBar';
import QueueSidebar from './QueueSidebar';
import AuthModal from '../modals/AuthModal';
import ForgotPasswordModal from '../modals/ForgotPasswordModal';
import ReportModal from '../modals/ReportModal';
import Toast from '../ui/Toast';
import MiniLyricsPanel from '../Lyrics/MiniLyricsPanel';
import ErrorBoundary from '../ui/ErrorBoundary';
import BottomNavbar from './BottomNavbar';

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
  const { isPiP, isReportModalOpen } = useSelector((state) => state.ui);
  const { currentSong } = useSelector((state) => state.player);
  const { user: authUser } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const isLyricsPage = location.pathname === '/lyrics';

  const syncUserFromBackend = async (cachedUser) => {
    if (!import.meta.env.VITE_API_URL || !cachedUser) return;
    try {
      const freshUser = await getProfile();
      if (freshUser) {
        const mergedUser = mergeUserRoleSafely(cachedUser, freshUser);
        if (!isSameUserSnapshot(cachedUser, mergedUser)) {
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

      // Fetch full profile từ BE để lấy artistId và các field DB khác
      // (localStorage chỉ có data từ idToken, không có artistId)
      let adaptedProfile = null;
      try {
        const profile = await api.get('/me', { silent: true });
        if (profile) {
          adaptedProfile = adaptUser(profile);
        }
      } catch { /* ignore — token hết hạn hoặc lỗi mạng */ }

      // Kiểm tra user có phải artist không qua /me/artist-request
      const artistData = await checkAndSaveArtistProfile(user.user_id);

      // Merge: nếu có artist profile → cập nhật role + artistId
      const finalUser = adaptedProfile || { ...user };
      if (artistData?.id) {
        finalUser.role = 'artist';
        finalUser.artist_id = artistData.id;
      }
      dispatch(loginSuccess(finalUser));

      // Restore liked songs từ API
      try {
        const liked = await getLikedSongs();
        if (liked.length > 0) dispatch(setLikedSongs(liked));
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const songId = params.get('song');
    if (!songId) return;

    navigate(`/song/${songId}`, { replace: true });
  }, [location.search, navigate]);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-black text-white overflow-hidden font-sans">
      <div className="flex-1 flex overflow-hidden md:px-2 p-0">
        {!isLyricsPage && (
          <aside className="w-64 bg-black flex-shrink-0 hidden md:flex flex-col">
            <Sidebar />
          </aside>
        )}

        <main className={`flex-1 bg-[#121212] rounded-lg mt-2 mb-2 overflow-y-auto relative ${isLyricsPage ? 'ml-2' : ''}`}>
          <div className="p-6 min-h-full bg-gradient-to-b from-[#1f1f1f] to-[#121212] relative overflow-x-hidden">
            <Navbar />
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        <QueueSidebar />
      </div>

      <footer className="h-auto flex flex-col gap-2 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.3)_10%,rgba(0,0,0,0.6)_60%,rgba(0,0,0,0.9)_95%)] flex-shrink-0 z-50 absolute bottom-0 left-0 right-0">
          <div className="h-[55px] md:h-[75px] shrink-0 bg-transparent mx-2 rounded-[8px]">
            <PlayerBar />
          </div>
          <div className="h-auto">
            <BottomNavbar />
          </div>
      </footer>

      <AuthModal />
      <ForgotPasswordModal />
      <Toast />
      {isPiP && currentSong && <MiniLyricsPanel />}
      {isReportModalOpen && <ReportModal />}
    </div>
  );
}
