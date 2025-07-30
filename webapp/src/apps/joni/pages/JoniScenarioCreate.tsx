import { useNavigate } from 'react-router-dom';
import { ScenarioForm } from '../components/ScenarioForm';

export function JoniScenarioCreate() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto pt-0 py-8">
      <ScenarioForm 
        onSuccess={() => navigate('/joni/scenarios')}
        onCancel={() => navigate('/joni/scenarios')}
      />
    </div>
  );
}