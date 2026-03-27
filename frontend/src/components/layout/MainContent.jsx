import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSong } from '../../store/playerSlice';
import { openModal, logout, setFollowedArtists } from '../../store/authSlice';
import { setSearchQuery, toggleBrowse, setView } from '../../store/uiSlice'; 
import { ChevronLeft, ChevronRight, Home, Bell, Users, BadgeCheck, Upload, ShieldCheck, BarChart3 } from 'lucide-react'; // [S6-004.4]
import { ROLES } from '../../constants/enums';

import CardSong from '../cards/CardSong';
import SearchContent from '../search/SearchContent';
import SearchResults from '../search/SearchResults';
import SearchBar from '../search/SearchBar';
import { getSongs } from '../../services/api/SongService';
import { getPersonalizedSongs, getTrendingSongs, getNewReleases, getDiscoverMix } from '../../services/api/RecommendationService';
import { logoutUser } from '../../services/api/AuthService';
import LyricsContent from '../lyrics/LyricsContent';
import ArtistVerifyPage from '../../pages/ArtistVerifyPage';
import UploadSongPage from '../../pages/UploadSongPage';
import AdminLayout from '../../pages/admin/AdminLayout';
import PlaylistDetailPage from '../../pages/PlaylistDetailPage';
import ProfilePage from '../../pages/ProfilePage';
import SettingsPage from '../../pages/SettingsPage';
import CategoryPage from '../../pages/CategoryPage';
import LikedSongsPage from '../../pages/LikedSongsPage';
import ArtistProfilePage from '../../pages/ArtistProfilePage';
import ArtistDashboardPage from '../../pages/ArtistDashboardPage';
import EditSongPage from '../../pages/EditSongPage';
import AlbumDetailPage from '../../pages/AlbumDetailPage';
import { getNotifications, markAsRead as markNotifAsRead, markAllAsRead } from '../../services/api/NotificationService';
import { setNotifications, markRead, markAllRead, toggleNotificationDropdown, closeNotificationDropdown } from '../../store/notificationSlice';
import { getFollowedArtists } from '../../services/api/ArtistService';

export default function MainContent() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [personalizedSongs, setPersonalizedSongs] = useState([]);
  const [discoverSongs, setDiscoverSongs] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  
  const { isAuthenticated, user, likedSongs } = useSelector((state) => state.auth);
  const { currentView, searchQuery, isBrowsing, isSearchSubmitted } = useSelector((state) => state.ui); 
  const { notifications, unreadCount, isDropdownOpen } = useSelector((state) => state.notification);
  const dispatch = useDispatch();
  const notifRef = useRef(null);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        setLoading(true);
        const data = await getSongs();
        setSongs(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu bài hát:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMusic();
  }, []);

  useEffect(() => {
    if (songs.length === 0) return;
    setTrendingSongs(getTrendingSongs(songs));
    setNewReleases(getNewReleases(songs));
    setPersonalizedSongs(getPersonalizedSongs(likedSongs || [], songs));
    setDiscoverSongs(getDiscoverMix(likedSongs || [], songs));
  }, [songs, likedSongs]);

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

  const handlePlaySong = (song) => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return; 
    }
    dispatch(setCurrentSong(song));
  };

  return (
    <div className="p-6 min-h-full bg-gradient-to-b from-[#1f1f1f] to-[#121212] relative overflow-x-hidden">
      
      {/* 1. TOP BAR (Thanh công cụ trên cùng) */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#121212]/95 backdrop-blur z-20 p-4 -mt-6 -mx-6 shadow-md">
        
        {/* Nút Back/Forward (Bên trái) */}
        <div className="flex items-center gap-2 w-1/4">
           <button className="bg-black/50 text-[#b3b3b3] p-2 rounded-full cursor-not-allowed"><ChevronLeft size={20}/></button>
           <button className="bg-black/50 text-[#b3b3b3] p-2 rounded-full cursor-not-allowed"><ChevronRight size={20}/></button>
        </div>

        {/* CỤM ĐIỀU HƯỚNG TRUNG TÂM (Trang chủ + Tìm kiếm) */}
        <div className="flex items-center justify-center gap-2 flex-1">
          {/* Nút Home: Bổ sung class fill-white khi đang ở home */}
          <button 
            className={`p-3 rounded-full transition duration-200 ${currentView === 'home' ? 'bg-[#333] text-white' : 'bg-[#242424] text-[#b3b3b3] hover:text-white hover:bg-[#333]'}`}
            onClick={() => dispatch(setView('home'))}
            title="Trang chủ"
          >
            <Home size={22} className={currentView === 'home' ? "fill-white" : ""} />
          </button>

          {/* Thanh SearchBar: Đã chuyển logic quản lý text vào trong SearchBar */}
          <div onClick={() => { if (currentView !== 'search') dispatch(setView('search')); }}>
            <SearchBar onOpenBrowse={() => dispatch(toggleBrowse())} />
          </div>
        </div>
        
        {/* Khu vực Auth (Bên phải) */}
        <div className="flex items-center justify-end gap-4 w-1/4">
          {!isAuthenticated ? (
            <>
              <button className="text-[#b3b3b3] font-bold hover:text-white hover:scale-105 transition whitespace-nowrap" onClick={() => dispatch(openModal('register'))}>Đăng ký</button>
              <button className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition whitespace-nowrap" onClick={() => dispatch(openModal('login'))}>Đăng nhập</button>
            </>
          ) : (
            <div className="flex items-center gap-5 relative">
              
              {/* Nút Nhắn tin / Group */}
              <button className="text-[#b3b3b3] hover:text-white hover:scale-105 transition" title="Trò chuyện">
                <Users size={20} />
              </button>

              {/* Nút Thông báo (Chuông) + Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  className="text-[#b3b3b3] hover:text-white hover:scale-105 transition relative"
                  title="Thông báo"
                  onClick={() => dispatch(toggleNotificationDropdown())}
                >
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
                        <button
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                          onClick={async () => {
                            await markAllAsRead();
                            dispatch(markAllRead());
                          }}
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-neutral-400 text-sm">
                          Không có thông báo nào
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-[#3e3e3e] cursor-pointer transition ${!notif.is_read ? 'bg-[#333]' : ''}`}
                            onClick={async () => {
                              if (!notif.is_read) {
                                await markNotifAsRead(notif.id);
                                dispatch(markRead(notif.id));
                              }
                            }}
                          >
                            <img
                              src={notif.image_url || '/pictures/whiteBackground.jpg'}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/pictures/whiteBackground.jpg'; }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-white leading-tight">{notif.message}</p>
                              <p className="text-xs text-neutral-400 mt-1">
                                {new Date(notif.created_at).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar User (Bấm vào để mở Dropdown) */}
              <div 
                className="flex items-center justify-center cursor-pointer bg-black/50 hover:bg-[#282828] p-1 rounded-full transition border-[3px] border-transparent hover:border-[#282828]"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                title={user.username}
              >
                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              </div>

              {/* Giao diện Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute top-12 right-0 w-48 bg-[#282828] rounded-md shadow-2xl z-50 p-1 border border-[#3e3e3e] text-sm font-semibold">
                  <button
                    className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                    onClick={() => { setIsUserMenuOpen(false); dispatch(setView('profile')); }}
                  >
                    Tài khoản
                  </button>
                  <button
                    className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                    onClick={() => { setIsUserMenuOpen(false); dispatch(setView('settings')); }}
                  >
                    Cài đặt
                  </button>

                  {user?.role !== ROLES.ARTIST && user?.role !== ROLES.ADMIN && (
                    <button
                      className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition flex items-center gap-2"
                      onClick={() => { setIsUserMenuOpen(false); dispatch(setView('artist-verify')); }}
                    >
                      <BadgeCheck size={14} />
                      Đăng ký nghệ sĩ
                    </button>
                  )}

                  {user?.role === ROLES.ARTIST && (
                    <button
                      className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition flex items-center gap-2"
                      onClick={() => { setIsUserMenuOpen(false); dispatch(setView('upload')); }}
                    >
                      <Upload size={14} />
                      Upload nhạc
                    </button>
                  )}

                  {/* [S6-004.4] Thống kê nghệ sĩ */}
                  {user?.role === ROLES.ARTIST && (
                    <button
                      className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition flex items-center gap-2"
                      onClick={() => { setIsUserMenuOpen(false); dispatch(setView('artist-dashboard')); }}
                    >
                      <BarChart3 size={14} />
                      Thống kê
                    </button>
                  )}

                  {user?.role === ROLES.ADMIN && (
                    <button
                      className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition flex items-center gap-2"
                      onClick={() => { setIsUserMenuOpen(false); dispatch(setView('admin')); }}
                    >
                      <ShieldCheck size={14} />
                      Admin Panel
                    </button>
                  )}
                  
                  {/* Đường kẻ ngang phân cách */}
                  <div className="h-[1px] bg-[#3e3e3e] my-1"></div>
                  
                  <button 
                    className="w-full text-left px-3 py-2.5 text-[#e5e5e5] hover:text-white hover:bg-[#3e3e3e] rounded-sm transition"
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logoutUser();
                      dispatch(logout());
                      window.location.reload();
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* 2. HIỂN THỊ NỘI DUNG TÙY THEO TAB ĐANG CHỌN */}
      {currentView === 'home' && (
        <>
          {loading ? (
            <div className="text-[#b3b3b3] text-center mt-10">Đang tải nhạc...</div>
          ) : (
            <>
              {/* Section 1: Dành cho bạn (chỉ khi đăng nhập + có liked songs) */}
              {isAuthenticated && personalizedSongs.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Dành cho bạn</h2>
                    <button
                      onClick={() => setExpandedSections((prev) => ({ ...prev, personalized: !prev.personalized }))}
                      className="text-sm font-bold text-[#b3b3b3] hover:text-white transition"
                    >
                      {expandedSections.personalized ? 'Thu gọn' : 'Hiện tất cả'}
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-6">
                    {(expandedSections.personalized ? personalizedSongs : personalizedSongs.slice(0, 5)).map((song) => (
                      <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Thịnh hành */}
              {trendingSongs.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Thịnh hành</h2>
                    <button
                      onClick={() => setExpandedSections((prev) => ({ ...prev, trending: !prev.trending }))}
                      className="text-sm font-bold text-[#b3b3b3] hover:text-white transition"
                    >
                      {expandedSections.trending ? 'Thu gọn' : 'Hiện tất cả'}
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-6">
                    {(expandedSections.trending ? trendingSongs : trendingSongs.slice(0, 5)).map((song) => (
                      <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Mới phát hành */}
              {newReleases.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Mới phát hành</h2>
                    <button
                      onClick={() => setExpandedSections((prev) => ({ ...prev, newReleases: !prev.newReleases }))}
                      className="text-sm font-bold text-[#b3b3b3] hover:text-white transition"
                    >
                      {expandedSections.newReleases ? 'Thu gọn' : 'Hiện tất cả'}
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-6">
                    {(expandedSections.newReleases ? newReleases : newReleases.slice(0, 5)).map((song) => (
                      <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Khám phá (chỉ khi đăng nhập) */}
              {isAuthenticated && discoverSongs.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Khám phá</h2>
                    <button
                      onClick={() => setExpandedSections((prev) => ({ ...prev, discover: !prev.discover }))}
                      className="text-sm font-bold text-[#b3b3b3] hover:text-white transition"
                    >
                      {expandedSections.discover ? 'Thu gọn' : 'Hiện tất cả'}
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-6">
                    {(expandedSections.discover ? discoverSongs : discoverSongs.slice(0, 5)).map((song) => (
                      <CardSong key={song.song_id} song={song} onPlay={handlePlaySong} />
                    ))}
                  </div>
                </div>
              )}

              {songs.length === 0 && (
                <div className="text-[#b3b3b3] text-center mt-10">Không có bài hát nào.</div>
              )}
            </>
          )}
        </>
      )}

      {/* B. NẾU Ở TAB TÌM KIẾM */}
      {currentView === 'search' && (
         <>
            {isBrowsing ? (
               // Đang bấm nút góc phải thanh Search -> Mở Categories
               <SearchContent />
            ) : isSearchSubmitted ? (
               // ĐÃ BẤM ENTER -> Hiển thị toàn màn hình kết quả Search
               <SearchResults query={searchQuery} onPlaySong={handlePlaySong} />
            ) : (
               // CHƯA LÀM GÌ HOẶC ĐANG GÕ (Hiện DropDown) -> Giao diện dưới trống
               <div className="flex flex-col items-center justify-center mt-20 text-[#b3b3b3]">
                  <h3 className="text-xl font-bold text-white mb-2">Bắt đầu tìm kiếm</h3>
                  <p>Tìm bài hát, nghệ sĩ, podcast và nhiều nội dung khác.</p>
               </div>
            )}
         </>
      )}

      {/* C. NẾU Ở TAB LỜI BÀI HÁT */}
      {currentView === 'lyrics' && (
         <LyricsContent />
      )}

      {/* D. NẾU Ở TAB ĐĂNG KÝ NGHỆ SĨ */}
      {currentView === 'artist-verify' && <ArtistVerifyPage />}

      {/* E. NẾU Ở TAB UPLOAD NHẠC */}
      {currentView === 'upload' && <UploadSongPage />}

      {/* F. NẾU Ở TAB ADMIN */}
      {currentView === 'admin' && <AdminLayout />}

      {/* G. PLAYLIST DETAIL */}
      {currentView === 'playlist-detail' && <PlaylistDetailPage />}

      {/* H. PROFILE */}
      {currentView === 'profile' && <ProfilePage />}

      {/* I. SETTINGS */}
      {currentView === 'settings' && <SettingsPage />}

      {/* J. CATEGORY DETAIL */}
      {currentView === 'category-detail' && <CategoryPage />}

      {/* K. LIKED SONGS */}
      {currentView === 'liked-songs' && <LikedSongsPage />}

      {/* L. ARTIST PROFILE — [S6-003.4] */}
      {currentView === 'artist-profile' && <ArtistProfilePage />}

      {/* M. ARTIST DASHBOARD — [S6-004.3] */}
      {currentView === 'artist-dashboard' && <ArtistDashboardPage />}

      {/* N. EDIT SONG — [S8-005.6] */}
      {currentView === 'edit-song' && <EditSongPage />}

      {/* O. ALBUM DETAIL — [S8-007.6] */}
      {currentView === 'album-detail' && <AlbumDetailPage />}

    </div>
  );
}