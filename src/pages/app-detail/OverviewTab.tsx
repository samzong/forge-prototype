import { motion } from 'framer-motion'
import { Clock, Shield, Users, CheckCircle2, XCircle, AlertTriangle, Activity, Zap } from 'lucide-react'
import type { App, Execution } from '@/types'
import { useExecutions } from '@/hooks/useExecutions'
import { useAppVersions } from '@/hooks/useAppVersions'
import { RelativeTime } from '@/components/RelativeTime'
import { InfoPanel, DeliveryRow } from './shared'

interface Props {
  app: App
}

export function OverviewTab({ app }: Props) {
  const { data: recentRes } = useExecutions({
    appId: app.id,
    size: 10,
    sort: 'startedAt-desc',
  })
  const { data: statsRes } = useExecutions({ appId: app.id, size: 500 })
  const { data: versionsRes } = useAppVersions({
    appId: app.id,
    size: 1,
    sort: 'createdAt-desc',
  })

  const recent = recentRes?.items ?? []
  const all = statsRes?.items ?? []
  const latestVersion = versionsRes?.items[0]
  const stats = summarize(all)
  const schedule = latestVersion?.manifest.schedule

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="px-8 py-6 grid gap-5"
      style={{ gridTemplateColumns: '1fr 320px' }}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Runs (all time)" value={String(stats.total)} hint={`${stats.last30d} in 30d`} />
          <StatCard
            label="Success rate"
            value={stats.successRate === null ? '—' : `${stats.successRate}%`}
            hint={stats.total === 0 ? 'No runs yet' : `${stats.succeeded}/${stats.completed}`}
            tone={stats.successRate !== null && stats.successRate >= 90 ? 'good' : 'neutral'}
          />
          <StatCard
            label="Avg duration"
            value={stats.avgDurationMs === null ? '—' : formatDuration(stats.avgDurationMs)}
            hint={`${stats.succeeded} succeeded`}
          />
        </div>

        <div className="bg-card border border-line rounded-[12px] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-[14px] pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-accent" />
              <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em]">
                Recent Runs
              </div>
            </div>
            <div className="text-[11px] text-fg-subtle font-mono">last {recent.length}</div>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-fg-muted">
              No runs yet.
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recent.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 + i * 0.025, duration: 0.22 }}
                  className="flex items-center gap-3 px-5 py-[11px] hover:bg-line-soft transition-colors"
                >
                  <ExecStatusIcon status={e.status} />
                  <RelativeTime
                    iso={e.startedAt}
                    className="font-mono text-[11px] text-fg-subtle w-[100px]"
                  />
                  <div className="flex-1 text-[12.5px] text-fg truncate">
                    {e.outputSummary ?? e.errorMessage ?? '—'}
                  </div>
                  <TriggerBadge trigger={e.trigger} />
                  <div className="font-mono text-[11px] text-fg-muted w-[56px] text-right">
                    {e.durationMs ? formatDuration(e.durationMs) : e.status === 'running' ? 'live' : '—'}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <InfoPanel title="Schedule" icon={<Clock size={12} />}>
          {schedule ? (
            <>
              <div className="text-[13px] text-fg font-medium">{humanCron(schedule)}</div>
              <div className="font-mono text-[11px] text-fg-subtle mt-1">cron: {schedule}</div>
            </>
          ) : (
            <div className="text-[12.5px] text-fg-muted">On-demand only</div>
          )}
        </InfoPanel>

        <InfoPanel title="Last Run">
          <LastRun execution={recent[0]} />
        </InfoPanel>

        <InfoPanel title="This Month">
          <div className="flex items-baseline gap-2">
            <span className="text-[18px] font-extrabold text-fg">{stats.thisMonth}</span>
            <span className="text-[11px] text-fg-subtle">runs</span>
            <span className="text-[11px] text-fg-subtle ml-auto">
              {stats.thisMonth === 0 ? '—' : `${stats.thisMonthSuccessRate}% success`}
            </span>
          </div>
        </InfoPanel>

        <InfoPanel title="Delivery">
          <div className="space-y-[6px]">
            <DeliveryRow label="feishu" target="#platform-oncall" />
            <DeliveryRow label="email" target="platform-team@" />
          </div>
        </InfoPanel>

        <InfoPanel title="Permissions" icon={<Shield size={12} />}>
          <div className="flex flex-wrap gap-[5px]">
            {app.capabilities.map((c) => (
              <span
                key={c}
                className="font-mono text-[10px] px-[7px] py-[2px] bg-bg border border-line rounded text-fg-muted font-semibold"
              >
                {c}
              </span>
            ))}
          </div>
        </InfoPanel>

        <InfoPanel title="Sharing" icon={<Users size={12} />}>
          <div className="text-[12px] text-fg">team-only · 3 subscribers</div>
        </InfoPanel>
      </div>
    </motion.div>
  )
}

interface Summary {
  total: number
  completed: number
  succeeded: number
  failed: number
  successRate: number | null
  avgDurationMs: number | null
  last30d: number
  thisMonth: number
  thisMonthSuccessRate: number
}

function summarize(items: Execution[]): Summary {
  if (items.length === 0) {
    return {
      total: 0,
      completed: 0,
      succeeded: 0,
      failed: 0,
      successRate: null,
      avgDurationMs: null,
      last30d: 0,
      thisMonth: 0,
      thisMonthSuccessRate: 0,
    }
  }
  const now = Date.now()
  const day30 = 30 * 24 * 60 * 60 * 1000
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  let succeeded = 0
  let failed = 0
  let completed = 0
  let durationSum = 0
  let durationCount = 0
  let last30 = 0
  let thisMonth = 0
  let thisMonthSucceeded = 0
  for (const e of items) {
    const ts = Date.parse(e.startedAt)
    if (e.status === 'succeeded') succeeded++
    if (e.status === 'failed' || e.status === 'timeout') failed++
    if (e.status !== 'running') completed++
    if (typeof e.durationMs === 'number') {
      durationSum += e.durationMs
      durationCount++
    }
    if (now - ts < day30) last30++
    if (ts >= monthStart) {
      thisMonth++
      if (e.status === 'succeeded') thisMonthSucceeded++
    }
  }
  const successRate = completed === 0 ? null : Math.round((succeeded / completed) * 100)
  const avgDurationMs = durationCount === 0 ? null : Math.round(durationSum / durationCount)
  return {
    total: items.length,
    completed,
    succeeded,
    failed,
    successRate,
    avgDurationMs,
    last30d: last30,
    thisMonth,
    thisMonthSuccessRate:
      thisMonth === 0 ? 0 : Math.round((thisMonthSucceeded / thisMonth) * 100),
  }
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone?: 'good' | 'neutral'
}) {
  const isGood = tone === 'good'
  return (
    <div
      className={`rounded-[12px] border p-[14px] ${
        isGood ? 'bg-accent-ultra border-accent/20' : 'bg-card border-line'
      }`}
    >
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider font-semibold">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-[5px]">
        <div
          className={`text-[26px] font-extrabold tracking-tight ${
            isGood ? 'text-accent' : 'text-fg'
          }`}
        >
          {value}
        </div>
      </div>
      <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">{hint}</div>
    </div>
  )
}

function ExecStatusIcon({ status }: { status: Execution['status'] }) {
  switch (status) {
    case 'succeeded':
      return <CheckCircle2 size={13} className="text-[#10b981] shrink-0" />
    case 'failed':
      return <XCircle size={13} className="text-[#ef4444] shrink-0" />
    case 'timeout':
      return <AlertTriangle size={13} className="text-[#f59e0b] shrink-0" />
    case 'running':
      return <Zap size={13} className="text-accent shrink-0 animate-pulse" />
    case 'cancelled':
      return <XCircle size={13} className="text-fg-subtle shrink-0" />
  }
}

function TriggerBadge({ trigger }: { trigger: Execution['trigger'] }) {
  const map: Record<Execution['trigger'], string> = {
    schedule: 'bg-bg text-fg-muted border-line',
    manual: 'bg-accent-ultra text-accent border-accent/20',
    webhook: 'bg-bg text-fg-muted border-line',
    test: 'bg-bg text-fg-subtle border-line',
  }
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-wider px-[6px] py-[2px] rounded border font-semibold ${map[trigger]}`}
    >
      {trigger}
    </span>
  )
}

function LastRun({ execution }: { execution: Execution | undefined }) {
  if (!execution) return <div className="text-[12.5px] text-fg-muted">No runs yet</div>
  return (
    <div>
      <div className="flex items-center gap-2">
        <ExecStatusIcon status={execution.status} />
        <span className="text-[13px] text-fg font-semibold capitalize">{execution.status}</span>
        {execution.durationMs && (
          <span className="text-[11px] text-fg-subtle">· {formatDuration(execution.durationMs)}</span>
        )}
      </div>
      <RelativeTime
        iso={execution.startedAt}
        className="font-mono text-[11px] text-fg-subtle mt-1 block"
      />
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return `${m}m ${s}s`
}

function humanCron(cron: string): string {
  switch (cron) {
    case '*/5 * * * *':
      return 'Every 5 minutes'
    case '0 9 * * *':
      return 'Every day · 9:00 AM'
    case '0 9 * * MON':
      return 'Every Monday · 9:00 AM'
    case '30 9 * * 1-5':
      return 'Weekdays · 9:30 AM'
    case '0 6 * * *':
      return 'Every day · 6:00 AM'
    default:
      return cron
  }
}
