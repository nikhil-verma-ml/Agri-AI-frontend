import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard   from './pages/Dashboard'
import AnalyzePage from './pages/AnalyzePage'
import AlertsPage  from './pages/AlertsPage'
import HistoryPage from './pages/HistoryPage'
import MarketPage  from './pages/MarketPage'
import LoginPage   from './pages/LoginPage'

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <AuthProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/mandi" element={
          <ProtectedRoute>
            <Layout><MarketPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/analyze" element={
          <ProtectedRoute>
            <Layout><AnalyzePage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/alerts" element={
          <ProtectedRoute>
            <Layout><AlertsPage /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/history" element={
          <ProtectedRoute>
            <Layout><HistoryPage /></Layout>
          </ProtectedRoute>
        } />

        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}