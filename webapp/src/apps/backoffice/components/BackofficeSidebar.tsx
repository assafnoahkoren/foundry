import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, Users, Settings, Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BackofficeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function BackofficeSidebar({ isOpen, onToggle }: BackofficeSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: '/backoffice', label: 'Dashboard', icon: Home },
    { path: '/backoffice/users', label: 'Users', icon: Users },
    { path: '/backoffice/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "border-r bg-background transition-all duration-300 h-screen fixed left-0",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className={cn("p-4", !isOpen && "px-2")}>
        {/* Logo/Title and Toggle */}
        <div className={cn(
          "mb-8 flex items-center h-10",
          isOpen ? "justify-between" : "justify-center"
        )}>
          {isOpen ? (
            <h2 className="font-bold text-xl">
              Backoffice
            </h2>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "transition-all shrink-0",
              !isOpen && "h-10 w-10"
            )}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/backoffice' && location.pathname.startsWith(item.path));

            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  !isOpen && "justify-center px-2"
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                {isOpen && <span>{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}