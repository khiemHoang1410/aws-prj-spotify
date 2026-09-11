import { useSelector } from 'react-redux';

export const translations = {
  vi: {
    // Navigation & Common
    home: 'Trang chủ',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Bạn muốn nghe gì?',
    yourLibrary: 'Thư viện',
    createPlaylist: 'Tạo danh sách phát',
    playlists: 'Danh sách phát',
    artists: 'Nghệ sĩ',
    likedSongs: 'Bài hát đã thích',
    recentlyPlayed: 'Đã nghe gần đây',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    profile: 'Hồ sơ',
    settings: 'Cài đặt',
    notifications: 'Thông báo',
    noNotifications: 'Không có thông báo mới',
    markAllAsRead: 'Đánh dấu tất cả đã đọc',
    
    // Settings Page
    settingsTitle: 'Cài đặt',
    restoreDefaults: 'Khôi phục mặc định',
    restoredSuccess: 'Đã khôi phục cài đặt mặc định',
    savedSuccess: 'Đã lưu cài đặt',
    
    // Settings Tabs
    tabLanguage: 'Ngôn ngữ',
    tabPlayback: 'Phát lại',
    tabLyrics: 'Lời bài hát',
    tabNotifications: 'Thông báo',
    tabStorage: 'Dữ liệu & Bộ nhớ',

    // Settings content - Language
    langDisplay: 'Ngôn ngữ hiển thị',
    langDisplayDesc: 'Chọn ngôn ngữ áp dụng cho toàn bộ giao diện Spotify',

    // Settings content - Playback
    autoplayTitle: 'Tự động phát',
    autoplayDesc: 'Tự động chuyển bài tiếp theo khi kết thúc bài hát hiện tại',

    // Settings content - Lyrics
    lyricsTitle: 'Hiển thị lời bài hát',
    lyricsDesc: 'Hiển thị lời bài hát đồng bộ (karaoke) và nút Lời bài hát trên thanh phát nhạc',

    // Settings content - Notifications
    notifTitle: 'Bật thông báo',
    notifDesc: 'Nhận thông báo tự động về bài hát mới và các hoạt động trong hệ thống',

    // Settings content - Storage & Data
    clearHistoryTitle: 'Xóa lịch sử nghe nhạc',
    clearHistoryDesc: 'Xóa toàn bộ các bài hát đã phát gần đây khỏi tài khoản và thiết bị này',
    clearHistoryBtn: 'Xóa lịch sử',
    clearHistorySuccess: 'Đã xóa toàn bộ lịch sử nghe nhạc',
    clearHistoryEmpty: 'Lịch sử nghe hiện đang trống',
    confirmClear: 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử nghe?',

    // Lyrics & Player
    lyricsTabLabel: 'Lời bài hát',
    commentsTabLabel: 'Bình luận',
    infoTabLabel: 'Thông tin',
    noLyrics: 'Chưa có lời cho bài hát này',
  },
  en: {
    // Navigation & Common
    home: 'Home',
    search: 'Search',
    searchPlaceholder: 'What do you want to play?',
    yourLibrary: 'Your Library',
    createPlaylist: 'Create playlist',
    playlists: 'Playlists',
    artists: 'Artists',
    likedSongs: 'Liked Songs',
    recentlyPlayed: 'Recently Played',
    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
    profile: 'Profile',
    settings: 'Settings',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    markAllAsRead: 'Mark all as read',
    
    // Settings Page
    settingsTitle: 'Settings',
    restoreDefaults: 'Restore defaults',
    restoredSuccess: 'Restored default settings',
    savedSuccess: 'Setting saved',
    
    // Settings Tabs
    tabLanguage: 'Language',
    tabPlayback: 'Playback',
    tabLyrics: 'Lyrics',
    tabNotifications: 'Notifications',
    tabStorage: 'Data & Storage',

    // Settings content - Language
    langDisplay: 'Display Language',
    langDisplayDesc: 'Choose the language used across the Spotify interface',

    // Settings content - Playback
    autoplayTitle: 'Autoplay',
    autoplayDesc: 'Keep on listening with similar tracks when your music ends',

    // Settings content - Lyrics
    lyricsTitle: 'Display Lyrics',
    lyricsDesc: 'Show time-synced karaoke lyrics and the lyrics button on the player bar',

    // Settings content - Notifications
    notifTitle: 'Enable Notifications',
    notifDesc: 'Receive updates about new releases and system activities',

    // Settings content - Storage & Data
    clearHistoryTitle: 'Clear Play History',
    clearHistoryDesc: 'Remove all recently played tracks from your account and this device',
    clearHistoryBtn: 'Clear History',
    clearHistorySuccess: 'Play history cleared successfully',
    clearHistoryEmpty: 'Play history is currently empty',
    confirmClear: 'Are you sure you want to clear your entire play history?',

    // Lyrics & Player
    lyricsTabLabel: 'Lyrics',
    commentsTabLabel: 'Comments',
    infoTabLabel: 'Credits',
    noLyrics: 'No lyrics available for this song',
  },
};

export const getTranslation = (key, lang = 'vi') => {
  const currentLang = translations[lang] || translations.vi;
  return currentLang[key] || translations.vi[key] || key;
};

export const useTranslation = () => {
  const currentLang = useSelector((state) => state.settings?.language || 'vi');
  const t = (key) => getTranslation(key, currentLang);
  return { t, currentLang };
};
