import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  // Separate selectors to avoid new object identity on each render (prevents infinite loop with zustand+useSyncExternalStore)
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.user?.vai_tro);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(role);
    if (!isAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
