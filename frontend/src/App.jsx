import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PlayerBar from './components/PlayerBar';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from './services/AuthService';
import { loginSuccess } from './store/authSlice';
import AuthModal from './components/AuthModal';
import PageIntro from './pages/PageIntro';
import QueueSidebar from './components/QueueSidebar';
import Toast from './components/shared/Toast';
import MiniLyricsPanel from './components/Lyrics/MiniLyricsPanel';
import ReportModal from './components/ReportModal';

function App() {
  const dispatch = useDispatch();
  // 2. Thêm hàm useEffect này ngay dưới khai báo dispatch:
  const { currentView, isPiP, isReportModalOpen } = useSelector((state) => state.ui);
  const { currentSong } = useSelector((state) => state.player);
  useEffect(() => {
    const restoreSession = async () => {
      const user = await getCurrentUser();
      if (user) {
        // Nếu tìm thấy Token và chưa hết hạn -> Nạp thẳng vào Redux (Vượt qua màn hình Login)
        dispatch(loginSuccess(user));
      }
    };
    restoreSession();
  }, [dispatch]);

  // NẾU STATE LÀ 'intro' -> RENDER ĐỘC LẬP TRANG INTRO
  if (currentView === 'intro') {
    return <PageIntro />;
  }
  return (
    <div className="h-screen w-full flex flex-col bg-black text-white overflow-hidden font-sans">
      {/* 2. TÌM KHU VỰC RENDER GIAO DIỆN CHÍNH VÀ SỬA THÀNH: */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* CỘT TRÁI: SIDEBAR THƯ VIỆN */}
        {currentView !== 'lyrics' && (
          <aside className="w-64 bg-black flex-shrink-0 flex flex-col">
            <Sidebar />
          </aside>
        )}
        
        {/* CỘT GIỮA: NỘI DUNG CHÍNH */}
        <main className={`flex-1 bg-[#121212] rounded-lg mt-2 mr-2 mb-2 overflow-y-auto relative ${currentView === 'lyrics' ? 'ml-2' : ''}`}>
          <MainContent />
        </main>

        {/* CỘT PHẢI: SIDEBAR HÀNG CHỜ (QUEUE) - Luôn sẵn sàng hiển thị */}
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

export default App;