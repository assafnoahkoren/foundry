import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, User, Mail, Hash } from 'lucide-react';

export const Protected = () => {
  const { user } = useAuth();

  return (
    <div id="protected-page" className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <h1 id="protected-title" className="text-3xl font-bold mb-2">Protected Page</h1>
        <p id="protected-description" className="text-lg text-muted-foreground">
          This is a protected route. Only authenticated users can see this.
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card id="user-details-card">
          <CardHeader>
            <CardTitle className="text-xl">Your Details</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-sm">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="auth-success-card" className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="flex items-center gap-4 pt-6">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                Authentication is working correctly!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                If you can see this page, you are successfully logged in.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};