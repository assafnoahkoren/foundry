import { BackToHubButton } from '@/components/BackToHubButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { LogOut, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import joniLogo from '../assets/logo.png';
import { JoniSidebar } from '../components/JoniSidebar';

export function JoniLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Start with sidebar closed on mobile
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSidebarItemClick = () => {
    // Close sidebar on mobile when an item is clicked
    if (isMobile) {
      setIsSidebarOpen(false);
    }
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
            
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex pt-[73px]">
          {/* Mobile overlay */}
          {isMobile && isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden pt-[73px]"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <JoniSidebar 
            isOpen={isSidebarOpen} 
            isMobile={isMobile}
            onItemClick={handleSidebarItemClick}
          />

          {/* Main Content */}
          <main className={cn(
            "flex-1 transition-all duration-300",
            !isMobile && isSidebarOpen ? "ml-64" : !isMobile ? "ml-16" : "ml-0"
          )}>
            <div className="container mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}