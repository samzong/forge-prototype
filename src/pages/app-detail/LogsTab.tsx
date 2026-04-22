import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Download } from 'lucide-react'
import type { App, ExecutionLog, ExecutionLogLevel } from '@/types'
import { useExecutions } from '@/hooks/useExecutions'
import { useExecutionLogs } from '@/hooks/useExecutionLogs'
import { RelativeTime } from '@/components/RelativeTime'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { StatusPill } from './ExecutionsTab'

type LevelFilter = 'all' | ExecutionLogLevel

const LEVEL_OPTIONS: Array<{ value: LevelFilter; label: string }> = [
  { value: 'all', label: 'All levels' },
  { value: 'debug', label: 'Debug' },
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'error', label: 'Error' },
]

interface Props {
  app: App
}

export function LogsTab({ app }: Props) {
  const execRes = useExecutions({
    appId: app.id,
    size: 1,
    sort: 'startedAt-desc',
  })
  const latest = execRes.data?.items[0]
  const logsRes = useExecutionLogs({ executionId: latest?.id, tail: true })
  const [level, setLevel] = useState<LevelFilter>('all')

  if (execRes.error)
    return <ErrorState error={execRes.error} onRetry={execRes.refresh} className="p-8" />
  if (execRes.loading && !latest)
    return <LoadingState label="Loading logs…" className="p-8" />
  if (!latest) return <EmptyState message="No executions yet" className="p-8" />

  const all = logsRes.data?.items ?? []
  const items = level === 'all' ? all : all.filter((l) => l.level === level)

  return (
    <div className="px-8 py-6 max-w-[1000px] mx-auto">
      <div className="bg-card border border-line rounded-[12px] p-4 mb-4 flex items-center gap-3 flex-wrap">
        <StatusPill status={latest.status} />
        <span className="font-mono text-[12px] text-fg-muted">{latest.id}</span>
        <RelativeTime iso={latest.startedAt} className="font-mono text-[11.5px] text-fg-subtle" />
        <Link
          to={`/apps/${app.id}/executions/${latest.id}`}
          className="ml-auto flex items-center gap-[4px] text-[12.5px] font-semibold text-accent hover:underline"
        >
          Full execution <ChevronRight size={12} />
        </Link>
      </div>

      <div className="bg-[#0a0a0a] rounded-[12px] overflow-hidden flex flex-col max-h-[620px] min-h-[380px]">
        <div className="flex items-center justify-between px-5 py-[10px] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/60 font-semibold">
              Live Tail
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
          {logsRes.error ? (
            <div className="text-[#fca5a5]">error: {logsRes.error.message}</div>
          ) : logsRes.loading && all.length === 0 ? (
            <div className="text-white/40">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-white/40">No log lines for this filter.</div>
          ) : (
            items.map((l) => <LogRow key={l.id} line={l} />)
          )}
        </div>
      </div>
    </div>
  )
}

function LogRow({ line }: { line: ExecutionLog }) {
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
  if (lines.length === 0) return
  const body = lines
    .map((l) => `${l.timestamp} ${l.level.toUpperCase()} [${l.tag}] ${l.message}`)
    .join('\n')
  const blob = new Blob([body], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${lines[0].executionId}.log`
  a.click()
  URL.revokeObjectURL(url)
}
