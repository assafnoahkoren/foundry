import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BackToHubButton } from '@/components/BackToHubButton';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import joniLogo from '../assets/logo.png';

export function JoniLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BackToHubButton />
                <img 
                  src={joniLogo} 
                  alt="Joni logo" 
                  className="w-10 h-10 object-contain cursor-pointer"
                  onClick={() => navigate('/joni')}
                />
              </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}