import { Routes, Route, Navigate } from 'react-router-dom';
import { JoniLayout } from './layouts/JoniLayout';
import JoniHome from './pages/JoniHome';
import { ScenarioSubjectsPage } from './pages/ScenarioSubjectsPage';
import { JoniScenarioGroupManagement } from './pages/JoniScenarioGroupManagement';
import { JoniScenarioGroupEdit } from './pages/JoniScenarioGroupEdit';

export function JoniApp() {
  return (
    <Routes>
      <Route element={<JoniLayout />}>
        <Route index element={<JoniHome />} />
        <Route path="subjects" element={<ScenarioSubjectsPage />} />
        <Route path="groups" element={<JoniScenarioGroupManagement />} />
        <Route path="groups/:groupId" element={<JoniScenarioGroupEdit />} />
        <Route path="*" element={<Navigate to="/joni" replace />} />
      </Route>
    </Routes>
  );
}