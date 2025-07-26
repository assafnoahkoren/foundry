import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const PrivateLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav style={{ 
        backgroundColor: '#2c3e50', 
        color: 'white',
        padding: '1rem',
        marginBottom: '2rem' 
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Aviaite
          </Link>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/protected" style={{ textDecoration: 'none', color: 'white' }}>Protected Page</Link>
            <span style={{ marginLeft: '1rem', marginRight: '0.5rem' }}>
              Welcome, {user?.name || 'User'}
            </span>
            <button 
              onClick={logout}
              style={{ 
                backgroundColor: '#e74c3c', 
                color: 'white', 
                border: 'none', 
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};