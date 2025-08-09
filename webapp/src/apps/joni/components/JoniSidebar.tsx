import { Button } from '@/components/ui/button';
import { useUserAccess } from '@/hooks/useUserAccess';
import { cn } from '@/lib/utils';
import { Home, Tags, Folder, GraduationCap, Radio, Mic, BookOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface JoniSidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  onItemClick?: () => void;
}

export function JoniSidebar({ isOpen, isMobile = false, onItemClick }: JoniSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasSubFeatureAccess } = useUserAccess();

  const hasScenarioAccess = hasSubFeatureAccess('backoffice', 'backoffice-scenario');
  const hasPracticeAccess = hasSubFeatureAccess('joni', 'joni-scenario-practice');
  const hasCommBlocksAccess = hasSubFeatureAccess('joni', 'joni-comm-blocks');

  const navigationItems = [
    { path: '/joni', label: 'Dashboard', icon: Home, requiresAccess: false },
    { path: '/joni/groups', label: 'Groups Management', icon: Folder, requiresAccess: true, show: hasScenarioAccess },
    { path: '/joni/subjects', label: 'Subjects Management', icon: Tags, requiresAccess: true, show: hasScenarioAccess },
    { path: '/joni/practice', label: 'Practice', icon: GraduationCap, requiresAccess: true, show: hasPracticeAccess },
    { path: '/joni/comm-blocks', label: 'Comm Blocks', icon: Radio, requiresAccess: true, show: hasCommBlocksAccess },
    { path: '/joni/transmissions', label: 'Transmissions', icon: Mic, requiresAccess: true, show: hasCommBlocksAccess },
    { path: '/joni/scripts', label: 'Scripts', icon: BookOpen, requiresAccess: true, show: hasCommBlocksAccess },
  ].filter(item => !item.requiresAccess || item.show);

  const handleNavigate = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  return (
    <aside className={cn(
      "border-r bg-background transition-all duration-300 h-[calc(100vh-73px)] fixed left-0 z-50",
      isOpen ? "w-64" : "w-16",
      // Mobile specific styles
      isMobile && isOpen ? "w-full" : "",
      isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
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
                onClick={() => handleNavigate(item.path)}
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