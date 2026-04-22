import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import GeneratePage from './pages/GeneratePage'
import AppsListPage from './pages/AppsListPage'
import AppDetailPage from './pages/AppDetailPage'
import ExecutionDetailPage from './pages/ExecutionDetailPage'
import VersionDetailPage from './pages/VersionDetailPage'
import MarketplacePage from './pages/MarketplacePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/apps" element={<AppsListPage />} />
        <Route path="/apps/:id" element={<AppDetailPage />} />
        <Route path="/apps/:id/executions/:eid" element={<ExecutionDetailPage />} />
        <Route path="/apps/:id/versions/:vid" element={<VersionDetailPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Route>
    </Routes>
  )
}
