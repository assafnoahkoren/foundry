import { Outlet, Link } from 'react-router-dom';

export const PublicLayout = () => {
  return (
    <div>
      <nav style={{ 
        backgroundColor: '#f0f0f0', 
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
          <Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Foundry
          </Link>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Home</Link>
            <Link to="/login" style={{ textDecoration: 'none', color: '#333' }}>Login</Link>
            <Link to="/register" style={{ textDecoration: 'none', color: '#333' }}>Register</Link>
          </div>
        </div>
      </nav>
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};