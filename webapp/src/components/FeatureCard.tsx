import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  hasAccess: boolean;
  logo: ReactNode;
  navigateTo: string;
}

export function FeatureCard({
  title,
  hasAccess,
  logo,
  navigateTo,
}: FeatureCardProps) {
  const handleClick = () => {
    if (hasAccess) {
      window.location.href = navigateTo;
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden transition-all duration-200 rounded-lg border p-6 w-48 h-48 flex items-center justify-center",
        "bg-white dark:bg-gray-800/50",
        hasAccess 
          ? "border-primary/20 shadow-sm hover:shadow-md cursor-pointer hover:border-primary/40" 
          : "border-muted/50 opacity-60 cursor-not-allowed"
      )}
      onClick={handleClick}
    >
      {!hasAccess && (
        <div className="absolute top-2 right-2 bg-muted/80 backdrop-blur-sm rounded-full p-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 flex items-center justify-center">
          {logo}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
    </div>
  );
}