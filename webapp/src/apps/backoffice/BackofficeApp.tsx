import { Routes, Route, Navigate } from 'react-router-dom';
import { BackofficeLayout } from './layouts/BackofficeLayout';
import BackofficeHome from './pages/BackofficeHome';
import ManageUsers from './pages/ManageUsers';

export function BackofficeApp() {
  return (
    <Routes>
      <Route element={<BackofficeLayout />}>
        <Route index element={<BackofficeHome />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="*" element={<Navigate to="/backoffice" replace />} />
      </Route>
    </Routes>
  );
}