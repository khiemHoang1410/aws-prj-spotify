import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Bell, Users, BadgeCheck, Upload, ShieldCheck, BarChart3 } from 'lucide-react';
import { openModal, logout, setFollowedArtists } from '../../store/authSlice';
import { toggleBrowse } from '../../store/uiSlice';
import { setNotifications, markRead, markAllRead, toggleNotificationDropdown, closeNotificationDropdown } from '../../store/notificationSlice';
import { getNotifications, markAsRead as markNotifAsRead, markAllAsRead } from '../../services/api/NotificationService';
import { getFollowedArtists } from '../../services/api/ArtistService';
import { logoutUser } from '../../services/api/AuthService';
import SearchBar from '../search/SearchBar';
import { ROLES } from '../../constants/enums';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef(null);

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { notifications, unreadCount, isDropdownOpen } = useSelector((state) => state.notification);
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (!isAuthenticated) return;
    getNotifications().then((data) => dispatch(setNotifications(data)));
    getFollowedArtists().then((artists) => {
      dispatch(setFollowedArtists(artists.map((a) => a.name)));
    });
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        dispatch(closeNotificationDropdown());
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, dispatch]);

  return (
    <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#121212]/95 backdrop-blur z-20 p-4 -mt-6 -mx-6 shadow-md">

      {/* Back / Forward */}
      <div className="flex items-center gap-2 w-1/4">
        <button onClick={() => navigate(-1)} className="bg-black/50 text-[#b3b3b3] p-2 rounded-full hover:text-white transition">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => navigate(1)} className="bg-black/50 text-[#b3b3b3] p-2 rounded-full hover:text-white transition">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Home + Search */}
      <div className="flex items-center justify-center gap-2 flex-1">
        <button
          className={`p-3 rounded-full transition duration-200 ${isHome ? 'bg-[#333] text-white' : 'bg-[#242424] text-[#b3b3b3] hover:text-white hover:bg-[#333]'}`}
          onClick={() => navigate('/')}
          title="Trang chủ"
        >
          <Home size={22} className={isHome ? 'fill-white' : ''} />
        </button>
        <div onClick={() => { if (location.pathname !== '/search') navigate('/search'); }}>
          <SearchBar onOpenBrowse={() => dispatch(toggleBrowse())} />
        </div>
      </div>

      {/* Auth area */}
      <div className="flex items-center justify-end gap-4 w-1/4">
        {!isAuthenticated ? (
          <>
            <button className="text-[#b3b3b3] font-bold hover:text-white hover:scale-105 transition whitespace-nowrap" onClick={() => dispatch(openModal('register'))}>
              Đăng ký
            </button>
            <button className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition whitespace-nowrap" onClick={() => dispatch(openModal('login'))}>
              Đăng nhập
            </button>
          </>
        ) : (
          <div className="flex items-center gap-5 relative">
            <button className="text-[#b3b3b3] hover:text-white hover:scale-105 transition" title="Trò chuyện">
              <Users size={20} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button className="text-[#b3b3b3] hover:text-white hover:scale-105 transition relative" title="Thông báo" onClick={() => dispatch(toggleNotificationDropdown())}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute top-10 right-0 w-80 bg-[#282828] rounded-lg shadow-2xl z-50 border border-[#3e3e3e] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#3e3e3e]">
                    <h3 className="text-sm font-bold text-white">Thông báo</h3>
                    {unreadCount > 0 && (
                      <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold" onClick={async () => { await markAllAsRead(); dispatch(markAllRead()); }}>
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-neutral-400 text-sm">Không có thông báo nào</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-[#3e3e3e] cursor-pointer transition ${!notif.is_read ? 'bg-[#333]' : ''}`}
                          onClick={async () => {
                            if (!notif.is_read) { await markNotifAsRead(notif.id); dispatch(markRead(notif.id)); }
                          }}
                        >
                          <img src={notif.image_url || '/pictures/whiteBackground.jpg'} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white leading-tight">{notif.message}</p>
                            <p className="text-xs text-neutral-400 mt-1">{new Date(notif.created_at).toLocaleDateString('vi-VN')}</p>
                          </div>
                          {!notif.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar + dropdown */}
            <div className="flex items-center justify-center cursor-pointer bg-black/50 hover:bg-[#282828] p-1 rounded-full transition border-[3px] border-transparent hover:border-[#282828]"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} title={user.username}>
              <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            </div>

            {isUserMenuOpen && (
              <div className="absolute top-12 right-0 w-48 bg-[#282828] rounded-md shadow-2xl z-50 p-1 border border-[#3e3e3e] text-sm font-semibold">
                {[
                  { label: 'Tài khoản', to: '/profile' },
                  { label: 'Cài đặt', to: '/settings' },
                ].map(({ label, to }) => (
                  <button key={to} className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                    onClick={() => { setIsUserMenuOpen(false); navigate(to); }}>
                    {label}
                  </button>
                ))}

                {user?.role !== ROLES.ARTIST && user?.role !== ROLES.ADMIN && (
                  <button className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition flex items-center gap-2"
                    onClick={() => { setIsUserMenuOpen(false); navigate('/artist-verify'); }}>
                    <BadgeCheck size={14} /> Đăng ký nghệ sĩ
                  </button>
                )}

                {user?.role === ROLES.ARTIST && (
                  <>
                    <button className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition flex items-center gap-2"
                      onClick={() => { setIsUserMenuOpen(false); navigate('/upload'); }}>
                      <Upload size={14} /> Upload nhạc
                    </button>
                    <button className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition flex items-center gap-2"
                      onClick={() => { setIsUserMenuOpen(false); navigate('/artist-dashboard'); }}>
                      <BarChart3 size={14} /> Thống kê
                    </button>
                  </>
                )}

                {user?.role === ROLES.ADMIN && (
                  <button className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition flex items-center gap-2"
                    onClick={() => { setIsUserMenuOpen(false); navigate('/admin'); }}>
                    <ShieldCheck size={14} /> Admin Panel
                  </button>
                )}

                <div className="h-[1px] bg-[#3e3e3e] my-1" />

                <button className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                  onClick={async () => { setIsUserMenuOpen(false); await logoutUser(); dispatch(logout()); navigate('/'); }}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
