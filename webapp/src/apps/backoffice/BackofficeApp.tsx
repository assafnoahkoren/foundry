import { Routes, Route, Navigate } from 'react-router-dom';
import { BackofficeLayout } from './layouts/BackofficeLayout';
import ManageUsers from './pages/ManageUsers';

export function BackofficeApp() {
  return (
    <Routes>
      <Route element={<BackofficeLayout />}>
        <Route index element={<ManageUsers />} />
        <Route path="users" element={<Navigate to="/backoffice" replace />} />
        <Route path="*" element={<Navigate to="/backoffice" replace />} />
      </Route>
    </Routes>
  );
}