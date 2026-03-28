import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from '../../services/api/AuthService';
import { loginSuccess } from '../../store/authSlice';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PlayerBar from './PlayerBar';
import QueueSidebar from './QueueSidebar';
import AuthModal from '../modals/AuthModal';
import ReportModal from '../modals/ReportModal';
import Toast from '../ui/Toast';
import MiniLyricsPanel from '../lyrics/MiniLyricsPanel';

export default function AppLayout() {
  const dispatch = useDispatch();
  const { isPiP, isReportModalOpen } = useSelector((state) => state.ui);
  const { currentSong } = useSelector((state) => state.player);
  const location = useLocation();

  const isLyricsPage = location.pathname === '/lyrics';

  useEffect(() => {
    const restoreSession = async () => {
      const user = await getCurrentUser();
      if (user) dispatch(loginSuccess(user));
    };
    restoreSession();
  }, [dispatch]);

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
            <Outlet />
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
