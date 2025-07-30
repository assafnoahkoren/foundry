import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueInputProps {
  label?: string;
  value?: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  placeholder?: {
    key?: string;
    value?: string;
  };
}

export function KeyValueInput({ 
  label, 
  value = {}, 
  onChange, 
  placeholder = { key: 'Key', value: 'Value' } 
}: KeyValueInputProps) {
  const lastExternalValue = useRef<string>('');
  
  // Initialize pairs from value prop
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    const initialPairs = Object.entries(value).map(([key, val]) => ({
      key,
      value: typeof val === 'object' ? JSON.stringify(val) : String(val)
    }));
    return initialPairs.length > 0 ? initialPairs : [{ key: '', value: '' }];
  });

  // Only sync with external value when it actually changes from outside
  useEffect(() => {
    const externalValueStr = JSON.stringify(value);
    if (externalValueStr !== lastExternalValue.current && Object.keys(value).length > 0) {
      // Build current value from pairs to compare
      const currentValue: Record<string, unknown> = {};
      pairs.forEach(pair => {
        if (pair.key.trim()) {
          try {
            currentValue[pair.key] = JSON.parse(pair.value);
          } catch {
            currentValue[pair.key] = pair.value;
          }
        }
      });
      
      // Only update if external value is different from current state
      if (JSON.stringify(currentValue) !== externalValueStr) {
        const newPairs = Object.entries(value).map(([key, val]) => ({
          key,
          value: typeof val === 'object' ? JSON.stringify(val) : String(val)
        }));
        setPairs(newPairs.length > 0 ? newPairs : [{ key: '', value: '' }]);
      }
      lastExternalValue.current = externalValueStr;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Intentionally omitting pairs to avoid circular updates

  const addPair = () => {
    const newPairs = [...pairs, { key: '', value: '' }];
    setPairs(newPairs);
  };

  const removePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs.length > 0 ? newPairs : [{ key: '', value: '' }]);
    
    // Update parent with new data
    const result: Record<string, unknown> = {};
    newPairs.forEach(pair => {
      if (pair.key.trim()) {
        try {
          result[pair.key] = JSON.parse(pair.value);
        } catch {
          result[pair.key] = pair.value;
        }
      }
    });
    
    // Update the ref to track this change came from internal update
    lastExternalValue.current = JSON.stringify(result);
    onChange(result);
  };

  const updatePair = (index: number, field: 'key' | 'value', newValue: string) => {
    const newPairs = [...pairs];
    newPairs[index][field] = newValue;
    setPairs(newPairs);
    
    // Only update parent if we have complete key-value pairs
    const result: Record<string, unknown> = {};
    
    newPairs.forEach(pair => {
      if (pair.key.trim()) {
        try {
          result[pair.key] = JSON.parse(pair.value);
        } catch {
          result[pair.key] = pair.value;
        }
      }
    });
    
    // Update the ref to track this change came from internal update
    lastExternalValue.current = JSON.stringify(result);
    onChange(result);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="space-y-2 border rounded-md p-3">
        {pairs.map((pair, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={placeholder.key}
              value={pair.key}
              onChange={(e) => updatePair(index, 'key', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder={placeholder.value}
              value={pair.value}
              onChange={(e) => updatePair(index, 'value', e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removePair(index)}
              disabled={pairs.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPair}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>
    </div>
  );
}