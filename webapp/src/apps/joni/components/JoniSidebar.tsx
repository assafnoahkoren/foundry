import { Button } from '@/components/ui/button';
import { useUserAccess } from '@/hooks/useUserAccess';
import { cn } from '@/lib/utils';
import { BookOpen, Gamepad2, Home, Mic, Radio, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface JoniSidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  onItemClick?: () => void;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ElementType;
  requiresAccess?: boolean;
  show?: boolean;
  isSubItem?: boolean;
  parentPath?: string;
}

export function JoniSidebar({ isOpen, isMobile = false, onItemClick }: JoniSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasSubFeatureAccess } = useUserAccess();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // const hasScenarioAccess = hasSubFeatureAccess('backoffice', 'backoffice-scenario');
  // const hasPracticeAccess = hasSubFeatureAccess('joni', 'joni-scenario-practice');
  const hasCommBlocksAccess = hasSubFeatureAccess('joni', 'joni-comm-blocks');

  // Auto-expand sections when navigating to their sub-pages
  useEffect(() => {
    const newExpanded = new Set<string>();
    if (location.pathname.startsWith('/joni/comm-blocks')) {
      newExpanded.add('/joni/comm-blocks');
    }
    if (location.pathname.startsWith('/joni/transmissions')) {
      newExpanded.add('/joni/transmissions');
    }
    setExpandedSections(newExpanded);
  }, [location.pathname]);

  const allNavigationItems: NavigationItem[] = [
    { path: '/joni', label: 'Dashboard', icon: Home, requiresAccess: false },
    // { path: '/joni/groups', label: 'Groups Management', icon: Folder, requiresAccess: true, show: hasScenarioAccess },
    // { path: '/joni/subjects', label: 'Subjects Management', icon: Tags, requiresAccess: true, show: hasScenarioAccess },
    // { path: '/joni/practice', label: 'Practice', icon: GraduationCap, requiresAccess: true, show: hasPracticeAccess },
    { path: '/joni/comm-blocks', label: 'Comm Blocks', icon: Radio, requiresAccess: true, show: hasCommBlocksAccess },
    { path: '/joni/comm-blocks/playground', label: 'Playground', icon: Gamepad2, requiresAccess: true, show: hasCommBlocksAccess, isSubItem: true, parentPath: '/joni/comm-blocks' },
    { path: '/joni/transmissions', label: 'Transmissions', icon: Mic, requiresAccess: true, show: hasCommBlocksAccess },
    { path: '/joni/transmissions/playground', label: 'Playground', icon: Gamepad2, requiresAccess: true, show: hasCommBlocksAccess, isSubItem: true, parentPath: '/joni/transmissions' },
    { path: '/joni/scripts', label: 'Scripts', icon: BookOpen, requiresAccess: true, show: hasCommBlocksAccess },
  ];

  // Group items by parent
  const itemsByParent = allNavigationItems.reduce((acc, item) => {
    if (!item.isSubItem && (!item.requiresAccess || item.show)) {
      acc[item.path] = { parent: item, children: [] };
    }
    return acc;
  }, {} as Record<string, { parent: NavigationItem; children: NavigationItem[] }>);

  // Add children to their parents
  allNavigationItems.forEach(item => {
    if (item.isSubItem && item.parentPath && itemsByParent[item.parentPath] && (!item.requiresAccess || item.show)) {
      itemsByParent[item.parentPath].children.push(item);
    }
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const toggleSection = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
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
          {Object.values(itemsByParent).map(({ parent, children }) => {
            const Icon = parent.icon;
            const isActive = location.pathname === parent.path;
            const isInSection = parent.path !== '/joni' && location.pathname.startsWith(parent.path);
            const isExpanded = expandedSections.has(parent.path);
            const hasSubItems = children.length > 0;
            
            return (
              <div key={parent.path}>
                <div className="relative flex items-center">
                  <Button
                    variant={isActive ? "secondary" : isInSection ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      !isOpen && "justify-center px-2",
                      isInSection && !isActive && "bg-secondary/50"
                    )}
                    onClick={() => handleNavigate(parent.path)}
                  >
                    <Icon className="h-4 w-4" />
                    {isOpen && (
                      <>
                        <span className="ml-3 flex-1 text-left">{parent.label}</span>
                        {hasSubItems && (
                          <button
                            type="button"
                            onClick={(e) => toggleSection(parent.path, e)}
                            className="p-1 hover:bg-background/50 rounded"
                          >
                            <ChevronDown 
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isExpanded && "rotate-180"
                              )}
                            />
                          </button>
                        )}
                      </>
                    )}
                  </Button>
                </div>

                {/* Animated sub-items container */}
                {hasSubItems && isOpen && (
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-3">
                      {children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === child.path;
                        
                        return (
                          <Button
                            key={child.path}
                            variant={isChildActive ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                              "w-full justify-start",
                              "animate-in slide-in-from-left-2 duration-200"
                            )}
                            onClick={() => handleNavigate(child.path)}
                          >
                            <ChildIcon className="h-3 w-3" />
                            <span className="ml-2 text-sm">{child.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      
      <style jsx>{`
        @keyframes slide-in-from-left-2 {
          from {
            transform: translateX(-8px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-in {
          animation: slide-in-from-left-2 0.2s ease-out forwards;
        }
      `}</style>
    </aside>
  );
}