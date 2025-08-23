import { Routes, Route, Navigate } from 'react-router-dom';
import { JoniLayout } from './layouts/JoniLayout';
import JoniHome from './pages/JoniHome';
import { ScenarioSubjectsPage } from './pages/ScenarioSubjectsPage';
import { JoniScenarioGroupManagement } from './pages/JoniScenarioGroupManagement';
import { JoniScenarioGroupEdit } from './pages/JoniScenarioGroupEdit';
import { JoniScenarioPractice } from './pages/JoniScenarioPractice';
import { JoniPracticeSession } from './pages/JoniPracticeSession';
import { CommBlocksManagement } from './pages/comm-blocks/CommBlocksManagement';
import { CommBlockForm } from './pages/comm-blocks/CommBlockForm';
import { CommBlocksPlayground } from './pages/comm-blocks/CommBlocksPlayground';
import { TransmissionManagement } from './pages/comm-blocks/TransmissionManagement';
import { TransmissionForm } from './pages/comm-blocks/TransmissionForm';
import { TransmissionsPlayground } from './pages/comm-blocks/TransmissionsPlayground';
import { ScriptManagement } from './pages/comm-blocks/ScriptManagement';
import { ScriptForm } from './pages/comm-blocks/ScriptForm';
import { ScriptEdit } from './pages/comm-blocks/ScriptEdit';
import { useJoniBranding } from './hooks/useJoniBranding';

export function JoniApp() {
  // Apply JONI branding (title and favicon)
  useJoniBranding();
  return (
    <Routes>
      <Route element={<JoniLayout />}>
        <Route index element={<JoniHome />} />
        <Route path="subjects" element={<ScenarioSubjectsPage />} />
        <Route path="groups" element={<JoniScenarioGroupManagement />} />
        <Route path="groups/:groupId" element={<JoniScenarioGroupEdit />} />
        <Route path="practice" element={<JoniScenarioPractice />} />
        <Route path="practice/:scenarioId" element={<JoniPracticeSession />} />
        <Route path="comm-blocks" element={<CommBlocksManagement />} />
        <Route path="comm-blocks/playground" element={<CommBlocksPlayground />} />
        <Route path="comm-blocks/new" element={<CommBlockForm />} />
        <Route path="comm-blocks/:id" element={<CommBlockForm />} />
        <Route path="transmissions" element={<TransmissionManagement />} />
        <Route path="transmissions/playground" element={<TransmissionsPlayground />} />
        <Route path="transmissions/new" element={<TransmissionForm />} />
        <Route path="transmissions/:id" element={<TransmissionForm />} />
        <Route path="scripts" element={<ScriptManagement />} />
        <Route path="scripts/new" element={<ScriptEdit />} />
        <Route path="scripts/:id" element={<ScriptEdit />} />
        <Route path="*" element={<Navigate to="/joni" replace />} />
      </Route>
    </Routes>
  );
}