import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Bảo vệ route theo auth và role.
 * @param {string} requiredRole - 'listener' | 'artist' | 'admin' (optional)
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, isSessionRestoring, user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Đang restore session từ localStorage — chưa biết trạng thái auth, đừng redirect
  if (isSessionRestoring) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, openLogin: true }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
