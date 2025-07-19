import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { trpc } from '../utils/trpc';
import { AuthContext } from './auth.context';
import type { User } from './auth.context';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from localStorage immediately
    const storedToken = localStorage.getItem('authToken');
    return storedToken;
  });
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('authToken'));

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  
  const { data: meData, isLoading: meLoading, error: meError } = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
    staleTime: Infinity, // Don't refetch on window focus
  });

  // Update user when me query succeeds
  useEffect(() => {
    if (meData && !meLoading) {
      setUser(meData);
      setIsLoading(false);
    } else if (meError) {
      setUser(null);
      setIsLoading(false);
    }
  }, [meData, meLoading, meError]);

  // Handle invalid token
  useEffect(() => {
    if (meError && token) {
      // Token is invalid, clear it
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
    }
  }, [meError, token]);

  // Update loading state for no token case
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await loginMutation.mutateAsync({ email, password });
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('authToken', response.token);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await registerMutation.mutateAsync({ email, password, name });
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('authToken', response.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    // Don't redirect here - let the PrivateRoute component handle it
  };


  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};