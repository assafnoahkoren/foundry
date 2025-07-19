import { useAuth } from '../hooks/useAuth';

export const Protected = () => {
  const { user } = useAuth();

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>Protected Page</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        🔒 This is a protected route. Only authenticated users can see this.
      </p>
      
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2>Your Details</h2>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>User ID:</strong> {user?.id}</p>
      </div>

      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#d4edda',
        color: '#155724',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '2rem auto'
      }}>
        <p>✅ Authentication is working correctly!</p>
        <p>If you can see this page, you are successfully logged in.</p>
      </div>
    </div>
  );
};