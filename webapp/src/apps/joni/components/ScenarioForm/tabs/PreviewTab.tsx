import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Plane, Radio, AlertCircle } from 'lucide-react';
import type { ScenarioFormData } from '../../../types/scenario-form.types';

interface PreviewTabProps {
  formData: ScenarioFormData;
}

export function PreviewTab({ formData }: PreviewTabProps) {
  const getScenarioTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      standard: 'Standard Operations',
      emergency: 'Emergency Procedures',
      crm: 'Crew Resource Management',
      technical: 'Technical Issues',
      weather: 'Weather-Related',
      medical: 'Medical Emergency',
      security: 'Security Situation',
    };
    return types[type] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{formData.name || 'Untitled Scenario'}</CardTitle>
          <CardDescription>{formData.shortDescription || 'No description provided'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{getScenarioTypeLabel(formData.scenarioType)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getDifficultyColor(formData.difficulty)}`} />
              <span className="text-sm capitalize">{formData.difficulty}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formData.estimatedMinutes} minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Initial Context */}
      {formData.initialContext && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Initial Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formData.initialContext}</p>
          </CardContent>
        </Card>
      )}

      {/* Flight Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Aircraft</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span> {formData.flightInformation.aircraft.type || 'Not specified'}
              </div>
              <div>
                <span className="text-muted-foreground">Callsign:</span> {formData.flightInformation.callsign || 'Not specified'}
              </div>
              {formData.flightInformation.aircraft.registration && (
                <div>
                  <span className="text-muted-foreground">Registration:</span> {formData.flightInformation.aircraft.registration}
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Weight Category:</span> {formData.flightInformation.aircraft.weightCategory}
              </div>
            </div>
          </div>

          {formData.flightInformation.route && (
            <div>
              <h4 className="font-medium mb-2">Route</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {formData.flightInformation.route.departure && (
                  <div>
                    <span className="text-muted-foreground">From:</span> {formData.flightInformation.route.departure}
                  </div>
                )}
                {formData.flightInformation.route.destination && (
                  <div>
                    <span className="text-muted-foreground">To:</span> {formData.flightInformation.route.destination}
                  </div>
                )}
                {formData.flightInformation.route.alternate && (
                  <div>
                    <span className="text-muted-foreground">Alternate:</span> {formData.flightInformation.route.alternate}
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.flightInformation.currentPosition && (
            <div>
              <h4 className="font-medium mb-2">Current Position</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Phase:</span> {formData.flightInformation.currentPosition.phase.replace('_', ' ')}
                </div>
                {formData.flightInformation.currentPosition.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span> {formData.flightInformation.currentPosition.location}
                  </div>
                )}
                {formData.flightInformation.currentPosition.altitude && (
                  <div>
                    <span className="text-muted-foreground">Altitude:</span> {formData.flightInformation.currentPosition.altitude}
                  </div>
                )}
                {formData.flightInformation.currentPosition.heading && (
                  <div>
                    <span className="text-muted-foreground">Heading:</span> {formData.flightInformation.currentPosition.heading}°
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.flightInformation.weather && (
            <div>
              <h4 className="font-medium mb-2">Weather</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {formData.flightInformation.weather.conditions && (
                  <div>
                    <span className="text-muted-foreground">Conditions:</span> {formData.flightInformation.weather.conditions}
                  </div>
                )}
                {formData.flightInformation.weather.wind && (
                  <div>
                    <span className="text-muted-foreground">Wind:</span> {formData.flightInformation.weather.wind}
                  </div>
                )}
                {formData.flightInformation.weather.visibility && (
                  <div>
                    <span className="text-muted-foreground">Visibility:</span> {formData.flightInformation.weather.visibility}
                  </div>
                )}
                {formData.flightInformation.weather.qnh && (
                  <div>
                    <span className="text-muted-foreground">QNH:</span> {formData.flightInformation.weather.qnh}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scenario Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Scenario Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No steps defined yet</p>
              <p className="text-sm">Go to the Scenario Steps tab to build your scenario</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.steps.map((step, index) => (
                <div key={step.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {step.eventType.toUpperCase()}
                        </Badge>
                        {step.actorRole && (
                          <span className="text-sm text-muted-foreground">
                            {step.actorRole.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{step.eventDescription}</p>
                      {step.eventMessage && (
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm italic">"{step.eventMessage}"</p>
                        </div>
                      )}
                      {step.expectedComponents.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Expected: {step.expectedComponents
                            .filter(c => c.required)
                            .map(c => c.component)
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < formData.steps.length - 1 && (
                    <Separator className="my-4 ml-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}