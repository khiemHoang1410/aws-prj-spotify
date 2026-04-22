import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { House, Music, Search ,ChevronLeft, ChevronRight, Home, Bell, Users, BadgeCheck, Upload, ShieldCheck, BarChart3, User,LogIn,UserRoundPlus,TextAlignJustify } from 'lucide-react';
import { openModal, logout, setFollowedArtists, loginSuccess } from '../../store/authSlice';
import { toggleBrowse } from '../../store/uiSlice';
import { setNotifications, markRead, markAllRead, toggleNotificationDropdown, closeNotificationDropdown } from '../../store/notificationSlice';
import { getNotifications, markAsRead as markNotifAsRead, markAllAsRead } from '../../services/NotificationService';
import { getFollowedArtists } from '../../services/ArtistService';
import { logoutUser, checkAndSaveArtistProfile } from '../../services/AuthService';
import { adaptUser } from '../../services/adapters';
import SearchBar from '../search/SearchBar';
import api from '../../services/apiClient';
import { ROLES } from '../../constants/enums';


export default function BottomNavbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { notifications, unreadCount, isDropdownOpen } = useSelector((state) => state.notification);
  const isHome = location.pathname === '/';

  const refreshNotifications = async () => {
    const data = await getNotifications();
    dispatch(setNotifications(data));
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshNotifications();
    getFollowedArtists().then((artists) => {
      dispatch(setFollowedArtists(artists.map((a) => a.name)));
    });
  }, [isAuthenticated, dispatch]);

  // Fetch profile từ /me + kiểm tra artist-request để cập nhật role mới nhất
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        // 1. Fetch profile cơ bản từ /me
        const profile = await api.get('/me', { silent: true });
        const adaptedUser = profile ? adaptUser(profile) : null;

        // 2. Kiểm tra có phải artist không qua /me/artist-request
        const artistData = await checkAndSaveArtistProfile(user.user_id);

        // 3. Merge role: nếu có artist profile → role = artist + gắn artistId
        const finalUser = adaptedUser || { ...user };
        if (artistData?.id) {
          finalUser.role = 'artist';
          finalUser.artist_id = artistData.id;
          finalUser.isVerified = artistData.isVerified ?? false;
        }

        dispatch(loginSuccess(finalUser));
      } catch {
        // Ignore: token hết hạn hoặc lỗi mạng
      }
    })();
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

  // Click outside đóng user menu
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  return (
    <div className="flex sm:hidden items-center justify-around h-[55px] pb-3  ">
        <button className="flex flex-col item-center justify-center "
          onClick={() => navigate('/')}
        >
            <House size={32} className="m-auto"/>
            <span className="text-[8px]">Trang chủ</span>
        </button>
        <button className="flex flex-col item-center justify-center "
          onClick ={() => navigate('/search')}
        >
            <Search size={32} className="m-auto"/>
            <span className="text-[8px]">Tìm kiếm</span>
        </button>
        <button className="flex flex-col item-center justify-center "
          onClick={() => navigate('/my-library')}
        >
            <Music size={32} className="m-auto"/>
            <span className="text-[8px]">Thư viện</span>
        </button>
        <button className="flex flex-col item-center justify-center "
          onClick={() => navigate('/profile')}
        >
            <User size={32} className="m-auto"/>
            <span className="text-[8px]">Cá nhân</span>
        </button>
    </div>
  );
}
