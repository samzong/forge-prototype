import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { AppManifest, AppVersion } from '@/types'
import { useApp } from '@/hooks/useApps'
import { useAppVersion, useAppVersions } from '@/hooks/useAppVersions'
import { rollbackToVersion } from '@/mock/appVersions'
import { RelativeTime } from '@/components/RelativeTime'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { InfoPanel } from './app-detail/shared'

type Pane = 'manifest' | 'handler'

export default function VersionDetailPage() {
  const { id, vid } = useParams<{ id: string; vid: string }>()
  const navigate = useNavigate()
  const appRes = useApp(id)
  const versionRes = useAppVersion(vid)
  const currentRes = useAppVersions({ appId: id ?? '', sort: 'createdAt-desc', size: 1 })
  const [pane, setPane] = useState<Pane>('manifest')
  const [rolling, setRolling] = useState(false)
  const [rollbackError, setRollbackError] = useState<string | null>(null)

  if (appRes.loading || versionRes.loading) {
    return <LoadingState label="Loading version…" className="p-8" />
  }
  if (appRes.error)
    return <ErrorState error={appRes.error} onRetry={appRes.refresh} className="p-8" />
  if (versionRes.error)
    return <ErrorState error={versionRes.error} onRetry={versionRes.refresh} className="p-8" />
  if (!appRes.data || !versionRes.data) {
    return (
      <EmptyState
        message="Version not found"
        ctaLabel="← Back to app"
        onCta={() => navigate(id ? `/apps/${id}/manage?tab=versions` : '/')}
        className="p-8"
      />
    )
  }

  const app = appRes.data
  const version = versionRes.data
  const current =
    currentRes.data?.items[0]?.version === app.currentVersion
      ? currentRes.data.items[0]
      : undefined
  const isCurrent = current?.id === version.id

  const handleRollback = async () => {
    if (!id) return
    setRolling(true)
    setRollbackError(null)
    try {
      await rollbackToVersion(id, version.id)
      navigate(`/apps/${id}/manage?tab=versions`)
    } catch (e) {
      setRollbackError(e instanceof Error ? e.message : String(e))
    } finally {
      setRolling(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="min-h-full"
    >
      <div className="px-8 pt-7 pb-5 bg-card border-b border-line">
        <Link
          to={`/apps/${app.id}/manage?tab=versions`}
          className="text-fg-muted hover:text-fg text-sm mb-3 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> {app.name} · Versions
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-extrabold text-fg tracking-tight leading-tight font-mono">
                {version.version}
              </h1>
              {isCurrent && (
                <span className="font-mono text-[10px] uppercase tracking-wider px-[7px] py-[2px] rounded bg-accent-ultra text-accent font-bold">
                  current
                </span>
              )}
              {version.isRollback && (
                <span className="font-mono text-[10px] uppercase tracking-wider px-[7px] py-[2px] rounded bg-[#fef3c7] text-[#92400e] font-bold">
                  rollback
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-[6px] text-[12.5px] text-fg-muted">
              <RelativeTime iso={version.createdAt} />
              <span className="text-line">·</span>
              <span>by {version.createdBy}</span>
            </div>
            {version.changeNote && (
              <div className="text-[13px] text-fg mt-[6px] max-w-[720px] leading-[1.55]">
                {version.changeNote}
              </div>
            )}
          </div>
          {!isCurrent && (
            <button
              onClick={handleRollback}
              disabled={rolling}
              className="px-[14px] py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] disabled:opacity-70 transition-colors"
            >
              <RotateCcw size={13} /> {rolling ? 'Rolling back…' : 'Rollback to this version'}
            </button>
          )}
        </div>
        {rollbackError && (
          <div className="mt-3 font-mono text-[11.5px] text-[#991b1b]">{rollbackError}</div>
        )}
      </div>

      <div className="px-8 py-6 grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        <div>
          <div className="flex items-center gap-1 mb-3">
            <PaneTab active={pane === 'manifest'} onClick={() => setPane('manifest')}>
              Manifest
            </PaneTab>
            <PaneTab active={pane === 'handler'} onClick={() => setPane('handler')}>
              Handler
            </PaneTab>
          </div>
          {pane === 'manifest' ? (
            <DiffBlock
              leftLabel={`current · ${current?.version ?? app.currentVersion}`}
              rightLabel={`this · ${version.version}`}
              left={current ? manifestToYaml(current.manifest) : '(unavailable)'}
              right={manifestToYaml(version.manifest)}
            />
          ) : (
            <DiffBlock
              leftLabel={`current · ${current?.version ?? app.currentVersion}`}
              rightLabel={`this · ${version.version}`}
              left={current?.handlerSource ?? '(unavailable)'}
              right={version.handlerSource}
            />
          )}
        </div>

        <div className="space-y-4">
          <InfoPanel title="Manifest summary">
            <ManifestSummary manifest={version.manifest} />
          </InfoPanel>
          {version.rolledBackFromVersionId && (
            <InfoPanel title="Rolled back from">
              <div className="font-mono text-[11.5px] text-fg-muted break-words">
                {version.rolledBackFromVersionId}
              </div>
            </InfoPanel>
          )}
          {version.sessionId && (
            <InfoPanel title="Source session">
              <div className="font-mono text-[11.5px] text-fg-muted break-words">
                {version.sessionId}
              </div>
            </InfoPanel>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function PaneTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-[7px] text-[12.5px] font-semibold rounded-[7px] transition-colors ${
        active ? 'bg-accent-ultra text-accent' : 'text-fg-muted hover:bg-line-soft'
      }`}
    >
      {children}
    </button>
  )
}

function DiffBlock({
  leftLabel,
  rightLabel,
  left,
  right,
}: {
  leftLabel: string
  rightLabel: string
  left: string
  right: string
}) {
  const same = left === right
  return (
    <div className="bg-[#0a0a0a] rounded-[12px] overflow-hidden">
      <div className="flex border-b border-white/10">
        <div className="flex-1 px-4 py-[10px] font-mono text-[10px] uppercase tracking-wider text-white/60 font-semibold">
          {leftLabel}
        </div>
        <div className="flex-1 px-4 py-[10px] font-mono text-[10px] uppercase tracking-wider text-white/60 font-semibold border-l border-white/10">
          {rightLabel}
        </div>
      </div>
      {same && (
        <div className="px-4 py-[8px] font-mono text-[10.5px] text-white/40 border-b border-white/10">
          no difference from current
        </div>
      )}
      <div className="grid grid-cols-2 font-mono text-[12px] text-white">
        <CodePane content={left} />
        <div className="border-l border-white/10">
          <CodePane content={right} />
        </div>
      </div>
    </div>
  )
}

function CodePane({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="p-4 overflow-auto max-h-[520px]">
      {lines.map((l, i) => (
        <div key={i} className="flex">
          <span className="text-white/25 select-none w-8 text-right pr-3 shrink-0">{i + 1}</span>
          <span className="whitespace-pre break-words">{l || '\u00A0'}</span>
        </div>
      ))}
    </div>
  )
}

function ManifestSummary({ manifest }: { manifest: AppManifest }) {
  return (
    <div className="space-y-[6px] text-[12px]">
      <Row label="identity">{manifest.runtimeIdentity}</Row>
      {manifest.schedule && <Row label="schedule">{manifest.schedule}</Row>}
      {manifest.dataRetention && <Row label="retention">{manifest.dataRetention}</Row>}
      <Row label="caps">
        <span className="font-mono text-fg-muted">{manifest.capabilities.length}</span>
      </Row>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider w-[72px]">
        {label}
      </span>
      <span className="font-mono text-[11.5px] text-fg">{children}</span>
    </div>
  )
}

function manifestToYaml(m: AppVersion['manifest']): string {
  const out: string[] = []
  out.push(`runtime_identity: ${m.runtimeIdentity}`)
  if (m.schedule) out.push(`schedule: ${m.schedule}`)
  if (m.dataRetention) out.push(`data_retention: ${m.dataRetention}`)
  out.push('capabilities:')
  for (const c of m.capabilities) out.push(`  - ${c}`)
  if (m.triggers && m.triggers.length > 0) {
    out.push('triggers:')
    for (const t of m.triggers) {
      out.push(`  - type: ${t.type}`)
      out.push(`    config: ${JSON.stringify(t.config)}`)
    }
  }
  return out.join('\n')
}
