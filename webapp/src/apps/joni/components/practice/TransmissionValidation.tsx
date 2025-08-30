import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockAnalysis {
  blockCode: string;
  blockName: string;
  expected: string;
  userInput: string;
  isCorrect: boolean;
  feedback: string;
  icaoCompliance: boolean;
}

interface TransmissionValidationProps {
  score: number;
  isCorrect: boolean;
  feedback: string;
  blockAnalysis: BlockAnalysis[];
  overallIcaoCompliance: boolean;
  suggestions: string[];
  onContinue?: () => void;
  onRetry?: () => void;
}

export function TransmissionValidation({
  score,
  isCorrect,
  feedback,
  blockAnalysis,
  overallIcaoCompliance,
  suggestions,
  onContinue,
  onRetry
}: TransmissionValidationProps) {
  // Determine score color and icon
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = () => {
    if (score >= 80) return <CheckCircle2 className="w-5 h-5" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  const getScoreBadgeVariant = () => {
    if (score >= 80) return 'default' as const;
    if (score >= 60) return 'secondary' as const;
    return 'destructive' as const;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getScoreIcon()}
            Transmission Validation Result
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant={getScoreBadgeVariant()} className="text-lg px-3 py-1">
              Score: {score}/100
            </Badge>
            {overallIcaoCompliance && (
              <Badge variant="outline" className="text-sm">
                ICAO Compliant
              </Badge>
            )}
            {/* Continue button at the top */}
            {onContinue && (
              <Button onClick={onContinue} size="sm">
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={score} className="h-3" />
          <p className={cn("text-sm font-medium", getScoreColor())}>
            {isCorrect ? 'Transmission Accepted' : 'Transmission Needs Improvement'}
          </p>
        </div>

        {/* Overall feedback */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">{feedback}</p>
        </div>

        {/* Block-by-block analysis */}
        {blockAnalysis.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Block Analysis:</h4>
            <div className="space-y-2">
              {blockAnalysis.map((block, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border",
                    block.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {block.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      )}
                      <span className="font-medium text-sm">{block.blockName}</span>
                      <Badge variant="outline" className="text-xs">
                        {block.blockCode}
                      </Badge>
                    </div>
                    {block.icaoCompliance && (
                      <Badge variant="outline" className="text-xs">
                        ICAO
                      </Badge>
                    )}
                  </div>
                  
                  <div className="ml-6 space-y-1">
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">Expected:</span> <span className="font-mono">{block.expected}</span></p>
                      <p><span className="font-medium">Your input:</span> <span className="font-mono">{block.userInput}</span></p>
                    </div>
                    {block.feedback && (
                      <p className="text-xs text-muted-foreground mt-2">{block.feedback}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Suggestions for Improvement:</h4>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          {isCorrect && onContinue && (
            <Button onClick={onContinue} className="flex-1">
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {!isCorrect && onRetry && (
            <Button onClick={onRetry} variant="outline" className="flex-1">
              <RotateCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {!isCorrect && onContinue && (
            <Button onClick={onContinue} variant="secondary" className="flex-1">
              Skip & Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}