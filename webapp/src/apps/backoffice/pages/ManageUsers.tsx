import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Mail, Calendar, Shield, Trash2, Edit, Key, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserForm } from '../components/UserForm';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { UserAccessForm } from '../components/UserAccessForm';

export default function ManageUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; name: string } | null>(null);
  const [accessFormUser, setAccessFormUser] = useState<{ id: string; name: string } | null>(null);

  // Fetch users
  const { data: users, isLoading } = trpc.admin.getUsers.useQuery();

  // Delete user mutation
  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      trpc.useUtils().admin.getUsers.invalidate();
      setUserToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter users based on search
  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteUser = (userId: string) => {
    deleteUser.mutate({ userId });
  };

  const handleCreateUser = () => {
    setEditingUserId(undefined);
    setIsFormOpen(true);
  };

  const handleEditUser = (userId: string) => {
    setEditingUserId(userId);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingUserId(undefined);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingUserId(undefined);
  };

  const handleResetPassword = (user: { id: string; name: string }) => {
    setResetPasswordUser(user);
  };

  const handleManageAccess = (user: { id: string; name: string }) => {
    setAccessFormUser(user);
  };

  // Calculate statistics
  const totalUsers = users?.length || 0;
  
  const activeToday = users?.filter(u => {
    const lastActive = new Date(u.updatedAt);
    const today = new Date();
    return lastActive.toDateString() === today.toDateString();
  }).length || 0;
  
  const newThisMonth = users?.filter(u => {
    const createdAt = new Date(u.createdAt);
    const now = new Date();
    return createdAt.getMonth() === now.getMonth() && 
           createdAt.getFullYear() === now.getFullYear();
  }).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all registered users
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeToday}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisMonth}</div>
            <p className="text-xs text-muted-foreground">Since month start</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                A list of all users with their account details
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">User</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user.id)}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageAccess({ id: user.id, name: user.name })}
                          title="Manage access"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword({ id: user.id, name: user.name })}
                          title="Reset password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(user.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user and all their data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg p-0" aria-describedby="user-form-description">
          <DialogTitle className="sr-only">
            {editingUserId ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <div className="sr-only" id="user-form-description">
            Form to create or edit user details
          </div>
          <UserForm
            userId={editingUserId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      {resetPasswordUser && (
        <ResetPasswordDialog
          userId={resetPasswordUser.id}
          userName={resetPasswordUser.name}
          open={!!resetPasswordUser}
          onOpenChange={(open) => !open && setResetPasswordUser(null)}
        />
      )}

      {/* User Access Form Dialog */}
      <Dialog open={!!accessFormUser} onOpenChange={(open) => !open && setAccessFormUser(null)}>
        <DialogContent className="max-w-2xl p-0" aria-describedby="user-access-form-description">
          <DialogTitle className="sr-only">
            Manage User Access
          </DialogTitle>
          <div className="sr-only" id="user-access-form-description">
            Form to manage feature access for the selected user
          </div>
          {accessFormUser && (
            <UserAccessForm
              userId={accessFormUser.id}
              userName={accessFormUser.name}
              onSuccess={() => setAccessFormUser(null)}
              onCancel={() => setAccessFormUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}