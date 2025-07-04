import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'

// Components
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import IncomingGoods from './pages/IncomingGoods'
import OutgoingGoods from './pages/OutgoingGoods'
import DamagedGoods from './pages/DamagedGoods'
import BarcodeGenerator from './pages/BarcodeGenerator'
import Reports from './pages/Reports'
import OrderList from './pages/OrderList'
import Pembukuan from './pages/Pembukuan'
import ActivityLogs from './pages/ActivityLogs'

function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, hasAnyRole } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }

  if (roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute roles={['manager']}>
                  <Layout>
                    <Products />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/incoming-goods" element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Layout>
                    <IncomingGoods />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/outgoing-goods" element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Layout>
                    <OutgoingGoods />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/damaged-goods" element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Layout>
                    <DamagedGoods />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/barcode-generator" element={
                <ProtectedRoute roles={['manager']}>
                  <Layout>
                    <BarcodeGenerator />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/order-list" element={
                <ProtectedRoute roles={['manager']}>
                  <Layout>
                    <OrderList />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/pembukuan" element={
                <ProtectedRoute roles={['manager']}>
                  <Layout>
                    <Pembukuan />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/activity-logs" element={
                <ProtectedRoute roles={['manager']}>
                  <Layout>
                    <ActivityLogs />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App