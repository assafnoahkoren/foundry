import { useParams, useNavigate } from 'react-router-dom';
import { ScenarioForm } from '../components/ScenarioForm';

export function JoniScenarioEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    navigate('/joni/scenarios');
    return null;
  }

  return (
    <div className="container mx-auto pt-0 py-8">
      <ScenarioForm 
        scenarioId={id}
        onSuccess={() => navigate('/joni/scenarios')}
        onCancel={() => navigate('/joni/scenarios')}
      />
    </div>
  );
}