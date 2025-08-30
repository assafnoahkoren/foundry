import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export function TransmissionValidationSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Evaluating Transmission...
          </CardTitle>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Overall feedback skeleton */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Block analysis skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="ml-6 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}