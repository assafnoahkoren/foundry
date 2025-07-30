import { Routes, Route, Navigate } from 'react-router-dom';
import { BackofficeLayout } from './layouts/BackofficeLayout';
import BackofficeHome from './pages/BackofficeHome';

export function BackofficeApp() {
  return (
    <Routes>
      <Route element={<BackofficeLayout />}>
        <Route index element={<BackofficeHome />} />
        <Route path="*" element={<Navigate to="/backoffice" replace />} />
      </Route>
    </Routes>
  );
}