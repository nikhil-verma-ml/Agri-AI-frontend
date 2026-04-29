import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard   from './pages/Dashboard'
import AnalyzePage from './pages/AnalyzePage'
import AlertsPage  from './pages/AlertsPage'
import HistoryPage from './pages/HistoryPage'
import MarketPage  from './pages/MarketPage' // <-- 1. Naya Page Import Kiya

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/analyze"  element={<AnalyzePage />} />
        <Route path="/alerts"   element={<AlertsPage />} />
        <Route path="/history"  element={<HistoryPage />} />
        <Route path="/mandi"    element={<MarketPage />} /> {/* <-- 2. Naya Route Add Kiya */}
      </Routes>
    </Layout>
  )
}