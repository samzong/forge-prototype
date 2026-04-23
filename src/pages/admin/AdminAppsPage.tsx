import { useMemo, useState } from 'react'
import { AppWindow, Search } from 'lucide-react'
import type { AppStatus } from '@/types'
import { useApps } from '@/hooks/useApps'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

type StatusFilter = AppStatus | 'all'

const STATUS_TONE: Record<AppStatus, string> = {
  running: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  deployed: 'text-[#1d4ed8] bg-[#dbeafe] border-[#bfdbfe]',
  stopped: 'text-fg-muted bg-bg border-line',
  draft: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  failed: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
}

const MINE_QUERY = { group: 'mine' as const, sort: 'updatedAt-desc' as const }
const SHARED_QUERY = { group: 'shared' as const, sort: 'updatedAt-desc' as const }
const MARKET_QUERY = { group: 'marketplace' as const, sort: 'updatedAt-desc' as const }

export default function AdminAppsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const mine = useApps(MINE_QUERY)
  const shared = useApps(SHARED_QUERY)
  const market = useApps(MARKET_QUERY)

  const loading = mine.loading || shared.loading || market.loading
  const error = mine.error ?? shared.error ?? market.error

  const rows = useMemo(() => {
    const all = [
      ...(mine.data?.items ?? []),
      ...(shared.data?.items ?? []),
      ...(market.data?.items ?? []),
    ]
    const seen = new Set<string>()
    const unique = all.filter((a) => {
      if (seen.has(a.id)) return false
      seen.add(a.id)
      return true
    })
    const needle = search.trim().toLowerCase()
    return unique.filter((a) => {
      if (status !== 'all' && a.status !== status) return false
      if (needle) {
        const hay = `${a.name} ${a.description} ${a.ownerId}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [mine.data, shared.data, market.data, search, status])

  const summary = useMemo(() => {
    const s = { total: 0, running: 0, failed: 0 }
    const seen = new Set<string>()
    const all = [
      ...(mine.data?.items ?? []),
      ...(shared.data?.items ?? []),
      ...(market.data?.items ?? []),
    ]
    for (const a of all) {
      if (seen.has(a.id)) continue
      seen.add(a.id)
      s.total++
      if (a.status === 'running') s.running++
      if (a.status === 'failed') s.failed++
    }
    return s
  }, [mine.data, shared.data, market.data])

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div>
          <h2 className="text-[14px] font-extrabold text-fg">All apps in tenant</h2>
          <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[520px]">
            Read-only inventory across mine, shared, and marketplace surfaces. Drill in for audit, deploy, and rollback.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Total" value={summary.total} tone="text-fg" />
          <StatTile label="Running" value={summary.running} tone="text-[#047857]" />
          <StatTile label="Failed" value={summary.failed} tone="text-[#b91c1c]" />
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-[14px] flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'running', label: 'Running' },
            { value: 'deployed', label: 'Deployed' },
            { value: 'stopped', label: 'Stopped' },
            { value: 'draft', label: 'Draft' },
            { value: 'failed', label: 'Failed' },
          ]}
        />
        <label className="ml-auto relative flex items-center min-w-[220px]">
          <Search size={13} className="absolute left-[10px] text-fg-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, owner, description…"
            className="w-full pl-[30px] pr-3 py-[7px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle"
          />
        </label>
      </section>

      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            mine.refresh()
            shared.refresh()
            market.refresh()
          }}
        />
      ) : loading && rows.length === 0 ? (
        <LoadingState label="Loading tenant apps…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={AppWindow}
          message="No apps match"
          hint="Clear filters or adjust the search."
        />
      ) : (
        <section className="bg-card border border-line rounded-xl overflow-hidden">
          <div
            className="grid gap-0 text-[12px]"
            style={{ gridTemplateColumns: '1.7fr 0.9fr 0.7fr 0.9fr 0.7fr' }}
          >
            <HeaderCell>App</HeaderCell>
            <HeaderCell>Owner</HeaderCell>
            <HeaderCell>Status</HeaderCell>
            <HeaderCell>Updated</HeaderCell>
            <HeaderCell>Version</HeaderCell>
            {rows.map((app) => (
              <AppRow
                key={app.id}
                name={app.name}
                icon={app.icon}
                ownerId={app.ownerId}
                id={app.id}
                status={app.status}
                updatedAt={app.updatedAt}
                version={app.currentVersion}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-[10px] bg-bg border-b border-line font-mono text-[10px] text-fg-subtle uppercase tracking-wider font-semibold">
      {children}
    </div>
  )
}

function AppRow(props: {
  name: string
  icon: string
  ownerId: string
  id: string
  status: AppStatus
  updatedAt: string
  version: string
}) {
  return (
    <>
      <div className="px-4 py-[11px] border-b border-line-soft flex items-center gap-[10px] min-w-0">
        <div className="w-[28px] h-[28px] rounded-[7px] bg-bg border border-line font-mono text-[11px] font-bold text-fg-muted flex items-center justify-center shrink-0">
          {props.icon}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-fg truncate">{props.name}</div>
          <div className="font-mono text-[10.5px] text-fg-subtle truncate">{props.id}</div>
        </div>
      </div>
      <div className="px-4 py-[11px] border-b border-line-soft flex items-center">
        <span className="font-mono text-[11.5px] text-fg-muted truncate">{props.ownerId}</span>
      </div>
      <div className="px-4 py-[11px] border-b border-line-soft flex items-center">
        <span
          className={`inline-flex items-center px-[8px] py-[3px] rounded-[6px] border font-mono text-[10.5px] font-semibold uppercase tracking-wider ${STATUS_TONE[props.status]}`}
        >
          {props.status}
        </span>
      </div>
      <div className="px-4 py-[11px] border-b border-line-soft flex items-center">
        <span
          className="font-mono text-[11px] text-fg-muted"
          title={absoluteTime(props.updatedAt)}
        >
          <RelativeTime iso={props.updatedAt} />
        </span>
      </div>
      <div className="px-4 py-[11px] border-b border-line-soft flex items-center">
        <span className="font-mono text-[11px] text-fg-muted">{props.version}</span>
      </div>
    </>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-bg border border-line rounded-[9px] px-4 py-3">
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-[20px] font-extrabold mt-[2px] ${tone}`}>{value}</div>
    </div>
  )
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </span>
      <div className="inline-flex bg-bg border border-line rounded-[8px] p-[2px] flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-[10px] py-[5px] text-[12px] font-semibold rounded-[6px] transition-colors ${
              value === opt.value
                ? 'bg-card text-accent shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
