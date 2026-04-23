import { useMemo } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '@/hooks/useApps'
import type { App } from '@/types'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { TabBar } from './app-detail/TabBar'
import { OverviewTab } from './app-detail/OverviewTab'
import { CodeTab } from './app-detail/CodeTab'
import { ManifestTab } from './app-detail/ManifestTab'
import { ExecutionsTab } from './app-detail/ExecutionsTab'
import { VersionsTab } from './app-detail/VersionsTab'
import { LogsTab } from './app-detail/LogsTab'
import { AuditTab } from './app-detail/AuditTab'
import { SettingsTab } from './app-detail/SettingsTab'
import { DEFAULT_TAB, isTab, type TabName } from './app-detail/tabs'
import { RunningPulse } from './app-detail/shared'

export default function AppManagePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: app, loading, error, refresh } = useApp(id)

  if (loading) return <LoadingState label="Loading app…" className="p-8" />
  if (error) return <ErrorState error={error} onRetry={refresh} className="p-8" />
  if (!app) {
    return (
      <EmptyState
        message="App not found"
        ctaLabel="← Back"
        onCta={() => navigate('/')}
        className="p-8"
      />
    )
  }

  if (app.group === 'marketplace') {
    return <Navigate to={`/marketplace/${app.id}`} replace />
  }

  return <ManageSurface app={app} />
}

function ManageSurface({ app }: { app: App }) {
  const [params, setParams] = useSearchParams()

  const tab: TabName = useMemo(() => {
    const t = params.get('tab')
    return isTab(t) ? t : DEFAULT_TAB
  }, [params])

  const setTab = (next: TabName) => {
    const p = new URLSearchParams(params)
    if (next === DEFAULT_TAB) p.delete('tab')
    else p.set('tab', next)
    setParams(p, { replace: false })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="min-h-full"
    >
      <div className="px-8 pt-6 pb-4 bg-card border-b border-line">
        <Link
          to={`/apps/${app.id}`}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Back to app
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 bg-accent text-white rounded-[9px] flex items-center justify-center font-mono text-[14px] font-extrabold shrink-0">
            {app.icon}
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h1 className="text-[17px] font-extrabold text-fg tracking-tight leading-tight truncate">
              {app.name}
            </h1>
            <span className="font-mono text-[10px] px-[7px] py-[2px] bg-bg border border-line rounded text-fg-muted font-semibold uppercase tracking-[0.08em]">
              Manage
            </span>
            <span className="font-mono text-[10.5px] px-[7px] py-[2px] bg-bg border border-line rounded text-fg-muted font-semibold">
              {app.currentVersion}
            </span>
            <RunningPulse on={app.status === 'running'} />
          </div>
        </div>
      </div>

      <TabBar active={tab} onChange={setTab} />
      <TabContent tab={tab} app={app} />
    </motion.div>
  )
}

function TabContent({ tab, app }: { tab: TabName; app: App }) {
  switch (tab) {
    case 'overview':
      return <OverviewTab app={app} />
    case 'code':
      return <CodeTab app={app} />
    case 'manifest':
      return <ManifestTab app={app} />
    case 'executions':
      return <ExecutionsTab app={app} />
    case 'versions':
      return <VersionsTab app={app} />
    case 'logs':
      return <LogsTab app={app} />
    case 'audit':
      return <AuditTab app={app} />
    case 'settings':
      return <SettingsTab app={app} />
  }
}
