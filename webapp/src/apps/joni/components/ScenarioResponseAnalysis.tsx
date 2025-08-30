import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  Plane,
  Radio
} from 'lucide-react';
import type { ResponseEvaluationResult } from '../types/scenario-practice.types';

interface ScenarioResponseAnalysisProps {
  analysis: ResponseEvaluationResult;
  userResponse: string;
  correctExample?: string;
}

export function ScenarioResponseAnalysis({ 
  analysis, 
  userResponse,
  correctExample 
}: ScenarioResponseAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Fair';
    if (score >= 3) return 'Needs Improvement';
    return 'Poor';
  };

  const getItemIcon = (type: 'correct' | 'wrong' | 'warning') => {
    switch (type) {
      case 'correct':
        return <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />;
      case 'wrong':
        return <XCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-600" />;
    }
  };

  const getItemStyles = (type: 'correct' | 'wrong' | 'warning') => {
    switch (type) {
      case 'correct':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50';
      case 'wrong':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Overall Performance</CardTitle>
            <div className="text-right">
              <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                {analysis.score}/10
              </div>
              <p className={`text-xs sm:text-sm ${getScoreColor(analysis.score)}`}>
                {getScoreLabel(analysis.score)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress 
            value={analysis.score * 10} 
            className="h-3"
          />
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
            {analysis.feedback}
          </p>
        </CardContent>
      </Card>

      {/* Your Response */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Plane className="h-3 sm:h-4 w-3 sm:w-4" />
            Your Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-2 sm:p-3">
            <p className="text-xs sm:text-sm font-medium italic">"{userResponse}"</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">Detailed Feedback</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {analysis.items.filter(i => i.type === 'correct').length} correct • 
            {' '}{analysis.items.filter(i => i.type === 'warning').length} warnings • 
            {' '}{analysis.items.filter(i => i.type === 'wrong').length} errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {analysis.items.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${getItemStyles(item.type)}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-xs sm:text-sm">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Component Analysis */}
      {(analysis.missingComponents.length > 0 || 
        analysis.incorrectComponents.length > 0 || 
        analysis.extraComponents.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Info className="h-3 sm:h-4 w-3 sm:w-4" />
              Component Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.missingComponents.length > 0 && (
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-600 mb-2">
                  Missing Required Components:
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingComponents.map((comp, index) => (
                    <Badge key={index} variant="destructive">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.incorrectComponents.length > 0 && (
              <div>
                <p className="text-xs sm:text-sm font-medium text-orange-600 mb-2">
                  Incorrect Component Values:
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.incorrectComponents.map((comp, index) => (
                    <Badge key={index} variant="secondary" className="border-orange-500">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.extraComponents.length > 0 && (
              <div>
                <p className="text-xs sm:text-sm font-medium text-yellow-600 mb-2">
                  Extra Components (Not Required):
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.extraComponents.map((comp, index) => (
                    <Badge key={index} variant="outline">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Correct Example */}
      {correctExample && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-green-900 dark:text-green-100">
              <Radio className="h-3 sm:h-4 w-3 sm:w-4" />
              Example of Correct Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-2 sm:p-3 border border-green-200 dark:border-green-800">
              <p className="text-xs sm:text-sm font-medium italic text-green-900 dark:text-green-100">
                "{correctExample}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}