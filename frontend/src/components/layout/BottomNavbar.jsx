import { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { House, Music, Search, User } from 'lucide-react';
import { setFollowedArtists } from '../../store/authSlice';
import { setNotifications, closeNotificationDropdown } from '../../store/notificationSlice';
import { getNotifications } from '../../services/NotificationService';
import { getFollowedArtists } from '../../services/ArtistService';


export default function BottomNavbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isDropdownOpen } = useSelector((state) => state.notification);

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
        
    </div>
  );
}
