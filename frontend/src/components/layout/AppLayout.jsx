import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, updateSessionUser, checkAndSaveArtistProfile } from '../../services/AuthService';
import { adaptUser } from '../../services/adapters';
import { loginSuccess, setVerifyStatus, setLikedSongs } from '../../store/authSlice';
import { getProfile } from '../../services/UserService';
import { getLikedSongs } from '../../services/PlaylistService';
import api from '../../services/apiClient';
import { VERIFY_STATUS } from '../../constants/enums';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PlayerBar from './PlayerBar';
import QueueSidebar from './QueueSidebar';
import AuthModal from '../modals/AuthModal';
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

const isSameLikedSongs = (currentLikedSongs, nextLikedSongs) => {
  if (currentLikedSongs.length !== nextLikedSongs.length) return false;
  return currentLikedSongs.every((song, index) => song.song_id === nextLikedSongs[index]?.song_id);
};

export default function AppLayout() {
  const dispatch = useDispatch();
  const { isPiP, isReportModalOpen } = useSelector((state) => state.ui);
  const { currentSong } = useSelector((state) => state.player);
  const { user: authUser, likedSongs: authLikedSongs } = useSelector((state) => state.auth);
  const location = useLocation();

  const isLyricsPage = location.pathname === '/lyrics';

  const syncUserFromBackend = async (cachedUser, { syncLikedSongs = false } = {}) => {
    if (!import.meta.env.VITE_API_URL || !cachedUser) return;
    try {
      const freshUser = await getProfile();
      if (freshUser?.user_id || cachedUser?.user_id) {
        const mergedUser = mergeUserRoleSafely(cachedUser, freshUser);
        if (!isSameUserSnapshot(cachedUser, mergedUser)) {
          updateSessionUser(mergedUser);
          dispatch(loginSuccess(mergedUser));
        }

        if (syncLikedSongs) {
          const likedSongs = await getLikedSongs();
          if (Array.isArray(likedSongs) && !isSameLikedSongs(authLikedSongs, likedSongs)) {
            dispatch(setLikedSongs(likedSongs));
          }
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
        const profile = await api.get('/me');
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

      // Restore liked songs từ localStorage theo từng user
      try {
        const raw = localStorage.getItem(`spotify_liked_${user.user_id}`);
        if (raw) {
          const liked = JSON.parse(raw);
          if (Array.isArray(liked)) dispatch(setLikedSongs(liked));
        }
      } catch { /* ignore */ }

      // Refresh user profile từ backend để cập nhật role mới nhất (ví dụ: artist vừa được duyệt)
      await syncUserFromBackend(user, { syncLikedSongs: true });
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
  }, [authUser, authLikedSongs]);

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

      <AuthModal />
      <Toast />
      {isPiP && currentSong && <MiniLyricsPanel />}
      {isReportModalOpen && <ReportModal />}
    </div>
  );
}
