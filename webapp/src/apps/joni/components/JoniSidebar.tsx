import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface JoniSidebarProps {
  isOpen: boolean;
}

export function JoniSidebar({ isOpen }: JoniSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: '/joni', label: 'Dashboard', icon: Home },
  ];

  return (
    <aside className={cn(
      "border-r bg-background transition-all duration-300 h-[calc(100vh-73px)] fixed left-0",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4">
        {/* Navigation items */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
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
                <Icon className="h-4 w-4" />
                {isOpen && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}