import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, LogOut, Shield, Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '../../hooks/useTheme';

export const PrivateLayout = () => {
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();

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
                id="protected-nav-link"
                to="/protected" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Shield className="h-4 w-4" />
                Protected Page
              </Link>
              
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      id="theme-toggle"
                      variant="ghost" 
                      size="icon"
                      className="h-9 w-9"
                    >
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      id="theme-light"
                      onClick={() => setTheme('light')}
                      className="flex items-center gap-2"
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      id="theme-dark"
                      onClick={() => setTheme('dark')}
                      className="flex items-center gap-2"
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      id="theme-system"
                      onClick={() => setTheme('system')}
                      className="flex items-center gap-2"
                    >
                      <Monitor className="h-4 w-4" />
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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