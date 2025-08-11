import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { PublicLayout } from './components/layouts/PublicLayout';
import { PrivateLayout } from './components/layouts/PrivateLayout';

// Public pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Private pages
import Hub from './pages/Hub';

// Apps
import { JoniApp } from './apps/joni/JoniApp';
import { BackofficeApp } from './apps/backoffice/BackofficeApp';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="welcome" element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Private routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<PrivateLayout />}>
              <Route path="/" element={<Hub />} />
            </Route>
            
            {/* Joni app with its own layout and nested routes */}
            <Route path="joni/*" element={<JoniApp />} />
            
            {/* Backoffice app with its own layout and nested routes */}
            <Route path="backoffice/*" element={<BackofficeApp />} />
          </Route>

          {/* Catch all - redirect to hub */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;