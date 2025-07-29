import { Routes, Route, Navigate } from 'react-router-dom';
import { JoniLayout } from './layouts/JoniLayout';
import JoniHome from './pages/JoniHome';

export function JoniApp() {
  return (
    <Routes>
      <Route element={<JoniLayout />}>
        <Route index element={<JoniHome />} />
        <Route path="*" element={<Navigate to="/joni" replace />} />
      </Route>
    </Routes>
  );
}