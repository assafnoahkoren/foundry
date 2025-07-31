import { Button } from '@/components/ui/button';
import { useUserAccess } from '@/hooks/useUserAccess';
import { cn } from '@/lib/utils';
import { FileText, Home, Tags, Folder } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface JoniSidebarProps {
  isOpen: boolean;
}

export function JoniSidebar({ isOpen }: JoniSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasSubFeatureAccess } = useUserAccess();

  const hasScenarioAccess = hasSubFeatureAccess('backoffice', 'backoffice-scenario');

  const navigationItems = [
    { path: '/joni', label: 'Dashboard', icon: Home, requiresAccess: false },
    { path: '/joni/groups', label: 'Groups Management', icon: Folder, requiresAccess: true, show: hasScenarioAccess },
    { path: '/joni/scenarios', label: 'Scenarios Management', icon: FileText, requiresAccess: true, show: hasScenarioAccess },
    { path: '/joni/subjects', label: 'Subjects Management', icon: Tags, requiresAccess: true, show: hasScenarioAccess },
  ].filter(item => !item.requiresAccess || item.show);

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
            const isActive = location.pathname === item.path || 
                           (item.path !== '/joni' && location.pathname.startsWith(item.path));
            
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