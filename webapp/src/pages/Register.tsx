import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Helper function to generate random values for dev environment
const generateDevValues = () => {
  const randomNum = Math.floor(Math.random() * 10000);
  const names = ['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  
  return {
    name: `${randomName} Test${randomNum}`,
    email: `user${randomNum}@example.com`,
    password: `testpass${randomNum}`
  };
};

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Auto-fill with random values in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      const devValues = generateDevValues();
      setName(devValues.name);
      setEmail(devValues.email);
      setPassword(devValues.password);
    }
  }, []);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="register-page" className="flex items-center justify-center px-4 py-8">
      <Card id="register-card" className="w-full max-w-md mx-auto">
        <CardHeader id="register-header" className="space-y-1">
          <CardTitle id="register-title" className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription id="register-description" className="text-center">
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent id="register-content" className="space-y-4">
            {error && (
              <div 
                id="register-error"
                className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm"
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter id="register-footer" className="flex flex-col space-y-4">
            <Button 
              id="register-submit-button"
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              variant="secondary"
            >
              {isLoading ? 'Creating account...' : 'Register'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                id="login-link"
                to="/login" 
                className="font-medium text-primary hover:underline"
              >
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};