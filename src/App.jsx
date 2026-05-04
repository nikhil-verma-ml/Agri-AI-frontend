import { Routes, Route, useLocation } from 'react-router-dom'
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

  const AppRoutes = (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/"         element={<Dashboard />} />
      <Route path="/analyze"  element={<AnalyzePage />} />
      <Route path="/alerts"   element={<AlertsPage />} />
      <Route path="/history"  element={<HistoryPage />} />
      <Route path="/mandi"    element={<MarketPage />} />
    </Routes>
  );

  if (isLoginPage) {
    return AppRoutes;
  }

  return (
    <Layout>
      {AppRoutes}
    </Layout>
  )
}