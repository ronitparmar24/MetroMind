import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function AdminGuard({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // Let the app handle loading state

  // If not logged in, they wouldn't reach here normally if wrapped inside AuthGuard,
  // but if used standalone, we redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is admin
  if (user.role !== 'admin') {
    // Silently redirect to dashboard without revealing the admin route exists
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

export default AdminGuard;
