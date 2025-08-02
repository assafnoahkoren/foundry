import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FlightInformation } from '../../../types/scenario-practice.types';

interface FlightInformationTabProps {
  flightInformation: FlightInformation;
  setFlightInformation: (info: FlightInformation) => void;
}

export function FlightInformationTab({ 
  flightInformation, 
  setFlightInformation 
}: FlightInformationTabProps) {
  
  const updateField = (path: string, value: string | number | undefined) => {
    const newInfo = { ...flightInformation };
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: Record<string, any> = newInfo as Record<string, any>;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setFlightInformation(newInfo);
  };

  return (
    <div className="space-y-8">
      {/* Aircraft Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Aircraft Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aircraftType">Aircraft Type *</Label>
            <Input
              id="aircraftType"
              value={flightInformation.aircraft.type}
              onChange={(e) => updateField('aircraft.type', e.target.value)}
              placeholder="e.g., Boeing 787-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="registration">Registration</Label>
            <Input
              id="registration"
              value={flightInformation.aircraft.registration || ''}
              onChange={(e) => updateField('aircraft.registration', e.target.value)}
              placeholder="e.g., 4X-ERA"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weightCategory">Weight Category</Label>
            <Select 
              value={flightInformation.aircraft.weightCategory || 'MEDIUM'} 
              onValueChange={(value) => updateField('aircraft.weightCategory', value)}
            >
              <SelectTrigger id="weightCategory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LIGHT">LIGHT</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="HEAVY">HEAVY</SelectItem>
                <SelectItem value="SUPER">SUPER</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="callsign">Callsign *</Label>
            <Input
              id="callsign"
              value={flightInformation.callsign}
              onChange={(e) => updateField('callsign', e.target.value)}
              placeholder="e.g., EL AL 321 Heavy"
            />
          </div>
        </div>
      </div>

      {/* Route Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Route Information</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departure">Departure Airport</Label>
            <Input
              id="departure"
              value={flightInformation.route?.departure || ''}
              onChange={(e) => updateField('route.departure', e.target.value)}
              placeholder="e.g., LLBG"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destination">Destination Airport</Label>
            <Input
              id="destination"
              value={flightInformation.route?.destination || ''}
              onChange={(e) => updateField('route.destination', e.target.value)}
              placeholder="e.g., EGLL"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="alternate">Alternate Airport</Label>
            <Input
              id="alternate"
              value={flightInformation.route?.alternate || ''}
              onChange={(e) => updateField('route.alternate', e.target.value)}
              placeholder="e.g., EHAM"
            />
          </div>
        </div>
      </div>

      {/* Current Position */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Position</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phase">Flight Phase</Label>
            <Select 
              value={flightInformation.currentPosition?.phase || 'preflight'} 
              onValueChange={(value) => updateField('currentPosition.phase', value)}
            >
              <SelectTrigger id="phase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preflight">Pre-flight</SelectItem>
                <SelectItem value="taxi">Taxi</SelectItem>
                <SelectItem value="takeoff">Takeoff</SelectItem>
                <SelectItem value="climb">Climb</SelectItem>
                <SelectItem value="cruise">Cruise</SelectItem>
                <SelectItem value="descent">Descent</SelectItem>
                <SelectItem value="approach">Approach</SelectItem>
                <SelectItem value="landing">Landing</SelectItem>
                <SelectItem value="taxi_in">Taxi In</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location/Stand</Label>
            <Input
              id="location"
              value={flightInformation.currentPosition?.location || ''}
              onChange={(e) => updateField('currentPosition.location', e.target.value)}
              placeholder="e.g., Stand B4 or FL350"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="altitude">Altitude</Label>
            <Input
              id="altitude"
              value={flightInformation.currentPosition?.altitude || ''}
              onChange={(e) => updateField('currentPosition.altitude', e.target.value)}
              placeholder="e.g., FL350 or 6000 feet"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="heading">Heading</Label>
            <Input
              id="heading"
              type="number"
              min={0}
              max={360}
              value={flightInformation.currentPosition?.heading || ''}
              onChange={(e) => updateField('currentPosition.heading', parseInt(e.target.value) || 0)}
              placeholder="0-360"
            />
          </div>
        </div>
      </div>

      {/* Weather & Conditions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Weather & Conditions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weather">Weather Conditions</Label>
            <Input
              id="weather"
              value={flightInformation.weather?.conditions || ''}
              onChange={(e) => updateField('weather.conditions', e.target.value)}
              placeholder="e.g., CAVOK or IMC"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="wind">Wind</Label>
            <Input
              id="wind"
              value={flightInformation.weather?.wind || ''}
              onChange={(e) => updateField('weather.wind', e.target.value)}
              placeholder="e.g., 270/08"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Input
              id="visibility"
              value={flightInformation.weather?.visibility || ''}
              onChange={(e) => updateField('weather.visibility', e.target.value)}
              placeholder="e.g., 10km or 3SM"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="qnh">QNH</Label>
            <Input
              id="qnh"
              type="number"
              value={flightInformation.weather?.qnh || ''}
              onChange={(e) => updateField('weather.qnh', parseInt(e.target.value) || 0)}
              placeholder="e.g., 1013"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="atis">ATIS Information</Label>
            <Input
              id="atis"
              value={flightInformation.atis || ''}
              onChange={(e) => updateField('atis', e.target.value)}
              placeholder="e.g., Information Alpha"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fuelRemaining">Fuel Remaining</Label>
            <Input
              id="fuelRemaining"
              value={flightInformation.fuel?.remaining || ''}
              onChange={(e) => updateField('fuel.remaining', e.target.value)}
              placeholder="e.g., 4 hours"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="soulsOnBoard">Souls on Board</Label>
            <Input
              id="soulsOnBoard"
              type="number"
              min={1}
              value={flightInformation.soulsOnBoard || ''}
              onChange={(e) => updateField('soulsOnBoard', parseInt(e.target.value) || 0)}
              placeholder="e.g., 285"
            />
          </div>
        </div>
      </div>
    </div>
  );
}