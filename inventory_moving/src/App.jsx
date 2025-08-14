import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import Receiving from './pages/Receiving';
import Issuing from './pages/Issuing';
import Report from './pages/Report';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/master-data"
            element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <MasterData />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/receiving"
            element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <Receiving />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/issuing"
            element={
              <ProtectedRoute roles={['admin']}>
                <Layout>
                  <Issuing />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Layout>
                  <Report />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;