import { useState } from 'react'
import { Navigate, useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Crosshair, Pause, Play, Settings2, Zap } from 'lucide-react'
import { useApp } from '@/hooks/useApps'
import type { App } from '@/types'
import { VibeChatTrigger, useVibeChat, type VibeChatSubject } from '@/components/vibe-chat'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { AppRenderer } from '@/components/app-use/AppRenderer'
import { RunningPulse } from './app-detail/shared'

function subjectFromApp(app: App): VibeChatSubject {
  return {
    type: 'app',
    id: app.id,
    name: app.name,
    icon: app.icon,
    description: app.description,
    capabilities: app.capabilities,
  }
}

export default function AppUsePage() {
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

  return <UseSurface app={app} />
}

function UseSurface({ app }: { app: App }) {
  const navigate = useNavigate()
  const [running, setRunning] = useState(app.status === 'running')
  const { startPicker, pickerActive } = useVibeChat()
  const subject = subjectFromApp(app)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="min-h-full"
    >
      <div className="px-5 h-11 bg-card border-b border-line flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          aria-label="Back"
          title="Back"
          className="text-fg-muted hover:text-fg transition-colors shrink-0 flex items-center"
        >
          <ArrowLeft size={15} />
        </button>
        <span className="w-px h-4 bg-line shrink-0" aria-hidden />
        <div className="w-6 h-6 bg-accent text-white rounded-[6px] flex items-center justify-center font-mono text-[10px] font-extrabold shrink-0">
          {app.icon}
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-[13px] font-bold text-fg tracking-tight truncate">
            {app.name}
          </h1>
          <span className="font-mono text-[10px] px-[6px] py-[1px] bg-bg border border-line rounded text-fg-muted font-semibold shrink-0">
            {app.currentVersion}
          </span>
          <RunningPulse on={running} />
        </div>

        <div className="flex items-center gap-[6px] shrink-0">
          <button
            onClick={() => setRunning((v) => !v)}
            className="px-[10px] h-7 bg-card border border-line rounded-[7px] text-[11.5px] font-semibold text-fg-muted hover:border-accent hover:text-accent flex items-center gap-[5px] transition-colors"
          >
            {running ? <Pause size={11} /> : <Play size={11} />}
            {running ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => startPicker(subject)}
            title="Pick a module to focus the chat"
            aria-label="Pick element"
            aria-pressed={pickerActive}
            className={`w-7 h-7 rounded-[7px] border flex items-center justify-center transition-colors ${
              pickerActive
                ? 'bg-accent border-accent text-white'
                : 'bg-card border-line text-fg-muted hover:border-accent hover:text-accent'
            }`}
          >
            <Crosshair size={12} />
          </button>
          <VibeChatTrigger
            subject={subject}
            variant="primary"
            label="Chat to edit"
            className="!px-[11px] !py-0 !h-7 !text-[11.5px] !rounded-[7px]"
          />
          <button className="px-[11px] h-7 bg-accent text-white rounded-[7px] text-[11.5px] font-semibold flex items-center gap-[5px] hover:bg-[#1d4ed8] transition-colors">
            <Zap size={11} /> Run Now
          </button>
          <span className="w-px h-4 bg-line mx-[2px]" aria-hidden />
          <Link
            to={`/apps/${app.id}/manage`}
            title="Manage · configuration, history, audit"
            className="w-7 h-7 rounded-[7px] border border-line text-fg-muted hover:border-accent hover:text-accent flex items-center justify-center transition-colors"
            aria-label="Manage"
          >
            <Settings2 size={13} />
          </Link>
        </div>
      </div>

      <AppRenderer app={app} />
    </motion.div>
  )
}
