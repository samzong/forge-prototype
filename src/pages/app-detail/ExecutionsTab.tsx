import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle, Zap } from 'lucide-react'
import type { App, Execution, ExecutionStatus, ExecutionTrigger } from '@/types'
import { useExecutions } from '@/hooks/useExecutions'
import { RelativeTime } from '@/components/RelativeTime'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'

interface Props {
  app: App
}

type StatusFilter = 'all' | ExecutionStatus
type TriggerFilter = 'all' | ExecutionTrigger

const PAGE_SIZE = 25

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Any status' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'timeout', label: 'Timeout' },
  { value: 'running', label: 'Running' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TRIGGER_OPTIONS: Array<{ value: TriggerFilter; label: string }> = [
  { value: 'all', label: 'Any trigger' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'manual', label: 'Manual' },
  { value: 'test', label: 'Test' },
]

export function ExecutionsTab({ app }: Props) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [trigger, setTrigger] = useState<TriggerFilter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [status, trigger])

  const query = useMemo(
    () => ({
      appId: app.id,
      page,
      size: PAGE_SIZE,
      status: status === 'all' ? undefined : status,
      trigger: trigger === 'all' ? undefined : trigger,
      sort: 'startedAt-desc' as const,
    }),
    [app.id, page, status, trigger],
  )

  const { data, loading, error, refresh } = useExecutions(query)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="px-8 py-6 max-w-[1100px] mx-auto">
      <div className="bg-card border border-line rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
        <Select label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <Select label="Trigger" value={trigger} onChange={setTrigger} options={TRIGGER_OPTIONS} />
        <div className="ml-auto font-mono text-[11px] text-fg-subtle uppercase tracking-wider">
          {total} total
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && items.length === 0 ? (
        <LoadingState label="Loading executions…" />
      ) : items.length === 0 ? (
        <EmptyState
          message="No executions match your filters"
          hint="Try a different filter combination or clear the selection."
        />
      ) : (
        <>
          <div className="bg-card border border-line rounded-xl overflow-hidden">
            <div className="grid grid-cols-[120px_110px_90px_80px_1fr_60px] gap-3 px-4 py-[11px] bg-bg border-b border-line font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-wider">
              <div>Started</div>
              <div>Status</div>
              <div>Trigger</div>
              <div>Duration</div>
              <div>Summary</div>
              <div className="text-right">Exit</div>
            </div>
            <div className="divide-y divide-line">
              {items.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.02, duration: 0.2 }}
                >
                  <Link
                    to={`/apps/${app.id}/executions/${e.id}`}
                    className="grid grid-cols-[120px_110px_90px_80px_1fr_60px] gap-3 px-4 py-[10px] items-center hover:bg-line-soft transition-colors"
                  >
                    <RelativeTime
                      iso={e.startedAt}
                      className="font-mono text-[11px] text-fg-subtle"
                    />
                    <StatusPill status={e.status} />
                    <TriggerBadge trigger={e.trigger} />
                    <span className="font-mono text-[11px] text-fg-muted">
                      {formatDuration(e)}
                    </span>
                    <span className="text-[12.5px] text-fg truncate">
                      {e.outputSummary ?? e.errorMessage ?? '—'}
                    </span>
                    <span className="font-mono text-[11px] text-fg-muted text-right">
                      {e.exitCode === undefined ? '—' : e.exitCode}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: string }>
}) {
  return (
    <label className="flex items-center gap-2 text-[12px] font-mono text-fg-subtle">
      <span className="uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-bg border border-line rounded-[8px] px-2 py-[7px] text-[13px] font-sans text-fg outline-none focus:border-accent cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function StatusPill({ status }: { status: ExecutionStatus }) {
  const map: Record<ExecutionStatus, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    succeeded: { label: 'Succeeded', cls: 'bg-[#d1fae5] text-[#065f46]', icon: CheckCircle2 },
    failed: { label: 'Failed', cls: 'bg-[#fee2e2] text-[#991b1b]', icon: XCircle },
    timeout: { label: 'Timeout', cls: 'bg-[#fef3c7] text-[#92400e]', icon: AlertTriangle },
    running: { label: 'Running', cls: 'bg-accent-ultra text-accent', icon: Zap },
    cancelled: { label: 'Cancelled', cls: 'bg-[#f3f4f6] text-fg-muted', icon: XCircle },
  }
  const c = map[status]
  const Icon = c.icon
  return (
    <span
      className={`inline-flex items-center gap-[5px] font-mono text-[10px] uppercase tracking-wider px-[7px] py-[2px] rounded font-bold ${c.cls}`}
    >
      <Icon size={10} />
      {c.label}
    </span>
  )
}

function TriggerBadge({ trigger }: { trigger: ExecutionTrigger }) {
  const cls: Record<ExecutionTrigger, string> = {
    schedule: 'bg-bg text-fg-muted border-line',
    manual: 'bg-accent-ultra text-accent border-accent/20',
    webhook: 'bg-bg text-fg-muted border-line',
    test: 'bg-bg text-fg-subtle border-line',
  }
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-wider px-[6px] py-[2px] rounded border font-semibold inline-block ${cls[trigger]}`}
    >
      {trigger}
    </span>
  )
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <PageButton disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous">
        <ChevronLeft size={14} />
      </PageButton>
      <span className="font-mono text-[12px] text-fg-muted px-3">
        {page} / {totalPages}
      </span>
      <PageButton
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next"
      >
        <ChevronRight size={14} />
      </PageButton>
    </div>
  )
}

function PageButton({
  disabled,
  onClick,
  children,
  ...rest
}: {
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled' | 'children'>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-[7px] border border-line flex items-center justify-center text-fg-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
      {...rest}
    >
      {children}
    </button>
  )
}

export function formatDuration(e: Execution): string {
  if (e.status === 'running') return 'live'
  if (typeof e.durationMs !== 'number') return '—'
  const ms = e.durationMs
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return `${m}m ${s}s`
}
