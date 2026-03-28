import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';

// Pages
import HomePage from '../pages/HomePage';
import SearchPage from '../pages/SearchPage';
import LyricsPage from '../pages/LyricsPage';
import PlaylistDetailPage from '../pages/PlaylistDetailPage';
import ArtistProfilePage from '../pages/ArtistProfilePage';
import AlbumDetailPage from '../pages/AlbumDetailPage';
import CategoryPage from '../pages/CategoryPage';
import LikedSongsPage from '../pages/LikedSongsPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import UploadSongPage from '../pages/UploadSongPage';
import ArtistDashboardPage from '../pages/ArtistDashboardPage';
import ArtistVerifyPage from '../pages/ArtistVerifyPage';
import EditSongPage from '../pages/EditSongPage';
import AdminLayout from '../pages/admin/AdminLayout';
import PageIntro from '../pages/PageIntro';

export const router = createBrowserRouter([
  // Trang intro — standalone, không có app shell
  { path: '/intro', element: <PageIntro /> },

  // App shell — tất cả routes bên trong dùng chung layout
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/lyrics', element: <LyricsPage /> },
      { path: '/playlist/:id', element: <PlaylistDetailPage /> },
      { path: '/artist/:id', element: <ArtistProfilePage /> },
      { path: '/album/:id', element: <AlbumDetailPage /> },
      { path: '/category/:id', element: <CategoryPage /> },

      // Protected — cần đăng nhập
      { path: '/liked', element: <ProtectedRoute><LikedSongsPage /></ProtectedRoute> },
      { path: '/profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: '/settings', element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
      { path: '/artist-verify', element: <ProtectedRoute><ArtistVerifyPage /></ProtectedRoute> },

      // Artist only
      { path: '/upload', element: <ProtectedRoute requiredRole="artist"><UploadSongPage /></ProtectedRoute> },
      { path: '/artist-dashboard', element: <ProtectedRoute requiredRole="artist"><ArtistDashboardPage /></ProtectedRoute> },
      { path: '/edit-song/:id', element: <ProtectedRoute requiredRole="artist"><EditSongPage /></ProtectedRoute> },

      // Admin only
      { path: '/admin/*', element: <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute> },
    ],
  },
]);
