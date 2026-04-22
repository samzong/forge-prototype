import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import GeneratePage from './pages/GeneratePage'
import AppsListPage from './pages/AppsListPage'
import AppDetailPage from './pages/AppDetailPage'
import ExecutionDetailPage from './pages/ExecutionDetailPage'
import VersionDetailPage from './pages/VersionDetailPage'
import MarketplacePage from './pages/MarketplacePage'
import MarketplaceDetailPage from './pages/MarketplaceDetailPage'
import MarketplacePublishPage from './pages/MarketplacePublishPage'
import SharedListPage from './pages/SharedListPage'
import SharedDetailPage from './pages/SharedDetailPage'
import SessionsPage from './pages/SessionsPage'
import SettingsLayout from './pages/settings/SettingsLayout'
import SettingsProfilePage from './pages/settings/SettingsProfilePage'
import SettingsTokensPage from './pages/settings/SettingsTokensPage'
import SettingsNotificationsPage from './pages/settings/SettingsNotificationsPage'
import SettingsCapabilitiesPage from './pages/settings/SettingsCapabilitiesPage'
import SettingsAuditPage from './pages/settings/SettingsAuditPage'
import LoginPage from './pages/auth/LoginPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import NotFoundPage from './pages/error/NotFoundPage'
import ForbiddenPage from './pages/error/ForbiddenPage'
import ServerErrorPage from './pages/error/ServerErrorPage'
import MaintenancePage from './pages/error/MaintenancePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/generate/:sessionId" element={<GeneratePage />} />
        <Route path="/apps" element={<AppsListPage />} />
        <Route path="/apps/:id" element={<AppDetailPage />} />
        <Route path="/apps/:id/executions/:eid" element={<ExecutionDetailPage />} />
        <Route path="/apps/:id/versions/:vid" element={<VersionDetailPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/publish" element={<MarketplacePublishPage />} />
        <Route path="/marketplace/:id" element={<MarketplaceDetailPage />} />
        <Route path="/shared" element={<SharedListPage />} />
        <Route path="/shared/:id" element={<SharedDetailPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<SettingsProfilePage />} />
          <Route path="tokens" element={<SettingsTokensPage />} />
          <Route path="notifications" element={<SettingsNotificationsPage />} />
          <Route path="capabilities" element={<SettingsCapabilitiesPage />} />
          <Route path="audit" element={<SettingsAuditPage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
