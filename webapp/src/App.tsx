import { useState } from 'react';
import { trpc } from './utils/trpc';
import './App.css';

function App() {
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // Fetch users with React Query through tRPC
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery({
    limit: 10,
    offset: 0,
  });

  // Create user mutation
  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      // Refetch users after creating
      refetch();
      setNewUserName('');
      setNewUserEmail('');
    },
  });

  // Delete user mutation
  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName && newUserEmail) {
      createUser.mutate({
        name: newUserName,
        email: newUserEmail,
      });
    }
  };

  return (
    <div className="App">
      <h1>Fastify + tRPC + React Demo</h1>
      
      <div className="card">
        <h2>Create New User</h2>
        <form onSubmit={handleCreateUser}>
          <input
            type="text"
            placeholder="Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            style={{ marginRight: '10px' }}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            style={{ marginRight: '10px' }}
          />
          <button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Users ({users?.total || 0})</h2>
        {isLoading ? (
          <p>Loading users...</p>
        ) : users?.items.length === 0 ? (
          <p>No users yet. Create one above!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {users?.items.map((user) => (
              <li key={user.id} style={{ marginBottom: '10px' }}>
                <strong>{user.name}</strong> - {user.email}
                <button
                  onClick={() => deleteUser.mutate({ id: user.id })}
                  disabled={deleteUser.isPending}
                  style={{ marginLeft: '10px' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <p>
          This demo shows end-to-end type safety with tRPC.
          <br />
          Try adding users and see the automatic type inference!
        </p>
      </div>
    </div>
  );
}

export default App;