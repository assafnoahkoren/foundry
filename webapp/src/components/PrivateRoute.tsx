import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const PrivateRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // You can replace this with a proper loading component
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  return user ? <Outlet /> : <Navigate to="/login" />;
};