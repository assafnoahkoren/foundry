import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield, LayoutGrid } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';

export const PrivateLayout = () => {
  const { user, logout } = useAuth();

  const HEADER_HEIGHT = '4rem'; // 64px

  return (
    <div id="private-layout" className="h-[100dvh] flex flex-col">
      <header 
        id="private-header" 
        className="bg-primary text-primary-foreground border-b"
        style={{ height: HEADER_HEIGHT }}
      >
        <nav className="h-full">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <Link 
              id="logo-link"
              to="/" 
              className="text-2xl font-bold hover:opacity-80 transition-opacity"
            >
              Aviaite
            </Link>
            
            <div className="flex items-center gap-6">
              <Link 
                id="hub-nav-link"
                to="/" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <LayoutGrid className="h-4 w-4" />
                Hub
              </Link>
              
              <Link 
                id="protected-nav-link"
                to="/protected" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Shield className="h-4 w-4" />
                Protected Page
              </Link>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span id="user-greeting" className="text-sm font-medium">
                    Welcome, {user?.name || 'User'}
                  </span>
                </div>
                
                <Button 
                  id="logout-button"
                  onClick={logout}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>
      </header>
      
      <main 
        id="private-main"
        className="flex-1 overflow-y-auto"
        style={{ minHeight: `calc(100dvh - ${HEADER_HEIGHT})` }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};