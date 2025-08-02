import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ScenarioFormData } from '../../../types/scenario-form.types';

interface OverviewTabProps {
  formData: ScenarioFormData;
  setFormData: (data: ScenarioFormData) => void;
  subjects: Array<{ id: string; name: string }>;
  groups: Array<{ id: string; name: string }>;
}

export function OverviewTab({ formData, setFormData, subjects, groups }: OverviewTabProps) {
  const updateField = <K extends keyof ScenarioFormData>(field: K, value: ScenarioFormData[K]) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Scenario Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Medical Emergency Over Atlantic"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDescription">Short Description</Label>
        <Textarea
          id="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => updateField('shortDescription', e.target.value)}
          placeholder="Brief overview of the scenario"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Select 
            value={formData.subjectId} 
            onValueChange={(value) => {
              updateField('subjectId', value);
              updateField('groupId', ''); // Reset group when subject changes
            }}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="group">Group (Optional)</Label>
          <Select 
            value={formData.groupId || 'no-group'} 
            onValueChange={(value) => updateField('groupId', value === 'no-group' ? '' : value)}
            disabled={!formData.subjectId}
          >
            <SelectTrigger id="group">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-group">No Group</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scenarioType">Scenario Type</Label>
        <Select 
          value={formData.scenarioType} 
          onValueChange={(value) => updateField('scenarioType', value)}
        >
          <SelectTrigger id="scenarioType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard Operations</SelectItem>
            <SelectItem value="emergency">Emergency Procedures</SelectItem>
            <SelectItem value="crm">Crew Resource Management</SelectItem>
            <SelectItem value="technical">Technical Issues</SelectItem>
            <SelectItem value="weather">Weather-Related</SelectItem>
            <SelectItem value="medical">Medical Emergency</SelectItem>
            <SelectItem value="security">Security Situation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Difficulty Level</Label>
        <RadioGroup 
          value={formData.difficulty} 
          onValueChange={(value) => updateField('difficulty', value)}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="beginner" id="beginner" />
            <Label htmlFor="beginner">Beginner</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="intermediate" id="intermediate" />
            <Label htmlFor="intermediate">Intermediate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="advanced" id="advanced" />
            <Label htmlFor="advanced">Advanced</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedMinutes">Estimated Duration (minutes)</Label>
        <Input
          id="estimatedMinutes"
          type="number"
          min={1}
          max={120}
          value={formData.estimatedMinutes}
          onChange={(e) => updateField('estimatedMinutes', parseInt(e.target.value) || 15)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="initialContext">Initial Context</Label>
        <Textarea
          id="initialContext"
          value={formData.initialContext}
          onChange={(e) => updateField('initialContext', e.target.value)}
          placeholder="Set the scene for the pilot. What's the situation at the start of the scenario?"
          rows={4}
        />
      </div>
    </div>
  );
}