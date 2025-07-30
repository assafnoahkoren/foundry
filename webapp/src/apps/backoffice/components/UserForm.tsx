import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  userId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function UserForm({ userId, onSuccess, onCancel }: UserFormProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const isEditMode = !!userId;

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Fetch user data in edit mode
  const { data: user, isLoading: userLoading } = trpc.admin.getUser.useQuery(
    { userId: userId! },
    { enabled: isEditMode }
  );

  // Mutations
  const createUser = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      utils.admin.getUsers.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateUser = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      utils.admin.getUsers.invalidate();
      utils.admin.getUser.invalidate({ userId: userId! });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Load user data in edit mode
  useEffect(() => {
    if (user && isEditMode) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!isEditMode && !password.trim()) {
      toast({
        title: 'Error',
        description: 'Password is required for new users',
        variant: 'destructive',
      });
      return;
    }

    if (isEditMode) {
      updateUser.mutate({
        userId: userId!,
        data: {
          name: name.trim(),
          email: email.trim(),
        },
      });
    } else {
      createUser.mutate({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });
    }
  };

  if (isEditMode && userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit User' : 'Create New User'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update the user details below' 
            : 'Fill in the details to create a new user account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createUser.isPending || updateUser.isPending}
            >
              {createUser.isPending || updateUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update User' : 'Create User'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}