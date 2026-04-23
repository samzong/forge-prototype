import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download } from 'lucide-react'
import { useApp } from '@/hooks/useApps'
import { useExecution } from '@/hooks/useExecutions'
import { useExecutionLogs } from '@/hooks/useExecutionLogs'
import type { ExecutionLog, ExecutionLogLevel } from '@/types'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { InfoPanel } from './app-detail/shared'
import { StatusPill, formatDuration } from './app-detail/ExecutionsTab'

type LevelFilter = 'all' | ExecutionLogLevel

const LEVEL_OPTIONS: Array<{ value: LevelFilter; label: string }> = [
  { value: 'all', label: 'All levels' },
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
]

export default function ExecutionDetailPage() {
  const { id, eid } = useParams<{ id: string; eid: string }>()
  const navigate = useNavigate()
  const appRes = useApp(id)
  const execRes = useExecution(eid)
  const logsRes = useExecutionLogs({ executionId: eid, tail: true })

  if (appRes.loading || execRes.loading) {
    return <LoadingState label="Loading execution…" className="p-8" />
  }
  if (appRes.error) return <ErrorState error={appRes.error} onRetry={appRes.refresh} className="p-8" />
  if (execRes.error) return <ErrorState error={execRes.error} onRetry={execRes.refresh} className="p-8" />
  if (!appRes.data || !execRes.data) {
    return (
      <EmptyState
        message="Execution not found"
        ctaLabel="← Back to app"
        onCta={() => navigate(id ? `/apps/${id}/manage?tab=executions` : '/')}
        className="p-8"
      />
    )
  }

  const app = appRes.data
  const exec = execRes.data

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="min-h-full"
    >
      <div className="px-8 pt-7 pb-5 bg-card border-b border-line">
        <Link
          to={`/apps/${app.id}/manage?tab=executions`}
          className="text-fg-muted hover:text-fg text-sm mb-3 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> {app.name} · Executions
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[20px] font-extrabold text-fg tracking-tight leading-tight font-mono">
                {exec.id}
              </h1>
              <StatusPill status={exec.status} />
              <span className="font-mono text-[11px] px-2 py-[3px] bg-bg border border-line rounded text-fg-muted font-semibold">
                {exec.versionId}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-[6px] font-mono text-[11.5px] text-fg-muted">
              <span>started {absoluteTime(exec.startedAt)}</span>
              <span className="text-line">·</span>
              <span>{formatDuration(exec)}</span>
              {exec.triggeredBy && (
                <>
                  <span className="text-line">·</span>
                  <span>by {exec.triggeredBy}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        <LogStream logsRes={logsRes} />
        <div className="space-y-4">
          <InfoPanel title="Trigger">
            <div className="text-[13px] text-fg capitalize">{exec.trigger}</div>
            {exec.triggeredBy && (
              <div className="font-mono text-[11px] text-fg-subtle mt-1">{exec.triggeredBy}</div>
            )}
          </InfoPanel>
          <InfoPanel title="Exit Code">
            <div className="text-[13px] text-fg font-mono">
              {exec.exitCode === undefined ? '—' : exec.exitCode}
            </div>
          </InfoPanel>
          {exec.outputSummary && (
            <InfoPanel title="Output">
              <div className="text-[12.5px] text-fg leading-[1.55]">{exec.outputSummary}</div>
            </InfoPanel>
          )}
          {exec.errorMessage && (
            <InfoPanel title="Error">
              <div className="font-mono text-[11.5px] text-[#991b1b] leading-[1.55] break-words">
                {exec.errorMessage}
              </div>
            </InfoPanel>
          )}
          <InfoPanel title="Timing">
            <Row label="started">
              <RelativeTime iso={exec.startedAt} />
            </Row>
            {exec.finishedAt && (
              <Row label="finished">
                <RelativeTime iso={exec.finishedAt} />
              </Row>
            )}
            <Row label="duration">{formatDuration(exec)}</Row>
          </InfoPanel>
        </div>
      </div>
    </motion.div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px] py-[2px]">
      <span className="font-mono text-fg-subtle uppercase tracking-wider w-[64px]">{label}</span>
      <span className="font-mono text-fg-muted">{children}</span>
    </div>
  )
}

function LogStream({
  logsRes,
}: {
  logsRes: ReturnType<typeof useExecutionLogs>
}) {
  const [level, setLevel] = useState<LevelFilter>('all')
  const { data, loading, error, refresh } = logsRes
  const all = data?.items ?? []
  const items = level === 'all' ? all : all.filter((l) => l.level === level)

  return (
    <div className="bg-[#0a0a0a] rounded-[12px] overflow-hidden flex flex-col max-h-[620px] min-h-[320px]">
      <div className="flex items-center justify-between px-5 py-[10px] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-white/60 font-semibold">
            Logs
          </div>
          <span className="font-mono text-[10px] text-white/40">
            {items.length}/{all.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as LevelFilter)}
            className="bg-white/10 border border-white/10 rounded-[7px] px-2 py-[4px] text-[11.5px] text-white/85 outline-none cursor-pointer font-mono"
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => download(all)}
            className="flex items-center gap-[5px] text-[11.5px] text-white/60 hover:text-white/85 font-mono"
          >
            <Download size={12} /> Download
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin font-mono text-[12px] p-4 space-y-[3px]">
        {error ? (
          <div className="text-[#fca5a5]">error: {error.message}</div>
        ) : loading && all.length === 0 ? (
          <div className="text-white/40">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-white/40">No log lines for this filter.</div>
        ) : (
          items.map((l) => <LogLineRow key={l.id} line={l} />)
        )}
      </div>
      {error && (
        <button
          onClick={refresh}
          className="border-t border-white/10 py-[8px] text-[11.5px] text-white/60 hover:text-white/85 font-mono"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function LogLineRow({ line }: { line: ExecutionLog }) {
  const levelCls: Record<ExecutionLogLevel, string> = {
    debug: 'text-white/45',
    info: 'text-white/85',
    warn: 'text-[#fbbf24]',
    error: 'text-[#fca5a5]',
  }
  const t = new Date(line.timestamp)
  const stamp = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}.${pad3(t.getMilliseconds())}`
  return (
    <div className="flex gap-3">
      <span className="text-white/30 w-[110px] shrink-0">{stamp}</span>
      <span className="text-white/35 uppercase w-[44px] shrink-0">{line.level}</span>
      <span className="text-white/40 w-[70px] shrink-0">[{line.tag}]</span>
      <span className={`${levelCls[line.level]} break-words`}>{line.message}</span>
    </div>
  )
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function pad3(n: number) {
  return String(n).padStart(3, '0')
}

function download(lines: ExecutionLog[]) {
  const body = lines
    .map((l) => `${l.timestamp} ${l.level.toUpperCase()} [${l.tag}] ${l.message}`)
    .join('\n')
  const blob = new Blob([body], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${lines[0]?.executionId ?? 'logs'}.log`
  a.click()
  URL.revokeObjectURL(url)
}
