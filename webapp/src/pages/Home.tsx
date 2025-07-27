import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div>
      <h1>Welcome to Aviaite</h1>
      <p>A modern full-stack TypeScript application with tRPC.</p>
      <div style={{ marginTop: '2rem' }}>
        <Link 
          to="/login" 
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#3498db', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '4px',
            marginRight: '1rem'
          }}
        >
          Login
        </Link>
        <Link 
          to="/register" 
          style={{ 
            padding: '0.75rem 1.5rem', 
            backgroundColor: '#2ecc71', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};