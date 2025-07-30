import { Routes, Route, Navigate } from 'react-router-dom';
import { JoniLayout } from './layouts/JoniLayout';
import JoniHome from './pages/JoniHome';
import { JoniScenarioManagement } from './pages/JoniScenarioManagement';
import { JoniScenarioCreate } from './pages/JoniScenarioCreate';
import { JoniScenarioEdit } from './pages/JoniScenarioEdit';

export function JoniApp() {
  return (
    <Routes>
      <Route element={<JoniLayout />}>
        <Route index element={<JoniHome />} />
        <Route path="scenarios" element={<JoniScenarioManagement />} />
        <Route path="scenarios/new" element={<JoniScenarioCreate />} />
        <Route path="scenarios/:id/edit" element={<JoniScenarioEdit />} />
        <Route path="*" element={<Navigate to="/joni" replace />} />
      </Route>
    </Routes>
  );
}