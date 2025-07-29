import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BackToHubButton } from '@/components/BackToHubButton';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Menu } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { JoniSidebar } from '../components/JoniSidebar';
import joniLogo from '../assets/logo.png';

export function JoniLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b fixed top-0 left-0 right-0 z-50 bg-background">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
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

        <div className="flex pt-[73px]">
          {/* Sidebar */}
          <JoniSidebar 
            isOpen={isSidebarOpen} 
          />

          {/* Main Content */}
          <main className={cn(
            "flex-1 transition-all duration-300",
            isSidebarOpen ? "ml-64" : "ml-16"
          )}>
            <div className="container mx-auto px-4 py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}