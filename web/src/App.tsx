import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { InterventionsPage } from './pages/InterventionsPage';
import { InvoicesPage } from './pages/InvoicesPage';

// Sécurisation des routes
const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('access_token');

  return isAuthenticated || token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Page de connexion */}
          <Route path="/login" element={<LoginPage />} />

          {/* Pages protégées */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <ClientsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/vehicles"
            element={
              <PrivateRoute>
                <VehiclesPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <PrivateRoute>
                <AppointmentsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/interventions"
            element={
              <PrivateRoute>
                <InterventionsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/invoices"
            element={
              <PrivateRoute>
                <InvoicesPage />
              </PrivateRoute>
            }
          />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
