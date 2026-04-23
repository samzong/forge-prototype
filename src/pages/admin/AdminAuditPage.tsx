import { useMemo, useState } from 'react'
import { History, Search } from 'lucide-react'
import type { AuditAction } from '@/types'
import { useAuditEvents } from '@/hooks/useAuditEvents'
import { useApps } from '@/hooks/useApps'
import { useUsers } from '@/hooks/useUsers'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

type ActionFilter = AuditAction | 'all'

const ACTION_TONE: Record<AuditAction, string> = {
  deploy: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  rollback: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  update: 'text-[#1d4ed8] bg-[#dbeafe] border-[#bfdbfe]',
  delete: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
  share: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
  unshare: 'text-fg-muted bg-bg border-line',
  fork: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
  subscribe: 'text-[#1d4ed8] bg-[#dbeafe] border-[#bfdbfe]',
  unsubscribe: 'text-fg-muted bg-bg border-line',
  publish: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  unpublish: 'text-fg-muted bg-bg border-line',
}

const AUDIT_QUERY = { sort: 'createdAt-desc' as const }
const APPS_MINE = { group: 'mine' as const }
const APPS_SHARED = { group: 'shared' as const }
const APPS_MARKET = { group: 'marketplace' as const }

export default function AdminAuditPage() {
  const [action, setAction] = useState<ActionFilter>('all')
  const [search, setSearch] = useState('')

  const { data, loading, error, refresh } = useAuditEvents(AUDIT_QUERY)
  const mine = useApps(APPS_MINE)
  const shared = useApps(APPS_SHARED)
  const market = useApps(APPS_MARKET)
  const { data: usersRes } = useUsers()

  const events = data?.items ?? []

  const appName = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of mine.data?.items ?? []) map.set(a.id, a.name)
    for (const a of shared.data?.items ?? []) map.set(a.id, a.name)
    for (const a of market.data?.items ?? []) map.set(a.id, a.name)
    return map
  }, [mine.data, shared.data, market.data])

  const userName = useMemo(() => {
    const map = new Map<string, string>()
    for (const u of usersRes?.items ?? []) map.set(u.id, u.displayName)
    return map
  }, [usersRes])

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return events.filter((e) => {
      if (action !== 'all' && e.action !== action) return false
      if (needle) {
        const app = appName.get(e.appId) ?? e.appId
        const actor = userName.get(e.actorId) ?? e.actorId
        const hay = `${app} ${actor} ${e.note ?? ''} ${e.action}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [events, action, search, appName, userName])

  const summary = useMemo(() => {
    let deploys = 0
    let deletes = 0
    for (const e of events) {
      if (e.action === 'deploy') deploys++
      if (e.action === 'delete') deletes++
    }
    return { total: events.length, deploys, deletes }
  }, [events])

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div>
          <h2 className="text-[14px] font-extrabold text-fg">Tenant audit log</h2>
          <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[520px]">
            Every mutation across apps, shares, and publications. Filter by
            action or search by app, actor, or note.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Events" value={summary.total} tone="text-fg" />
          <StatTile label="Deploys" value={summary.deploys} tone="text-[#047857]" />
          <StatTile label="Deletes" value={summary.deletes} tone="text-[#b91c1c]" />
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-[14px] flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Action"
          value={action}
          onChange={(v) => setAction(v as ActionFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'deploy', label: 'Deploy' },
            { value: 'rollback', label: 'Rollback' },
            { value: 'update', label: 'Update' },
            { value: 'delete', label: 'Delete' },
            { value: 'share', label: 'Share' },
            { value: 'fork', label: 'Fork' },
            { value: 'subscribe', label: 'Subscribe' },
            { value: 'publish', label: 'Publish' },
          ]}
        />
        <label className="ml-auto relative flex items-center min-w-[240px]">
          <Search size={13} className="absolute left-[10px] text-fg-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search app, actor, note…"
            className="w-full pl-[30px] pr-3 py-[7px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle"
          />
        </label>
      </section>

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && rows.length === 0 ? (
        <LoadingState label="Loading audit log…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={History}
          message="No audit events match"
          hint="Adjust the filter or clear the search."
        />
      ) : (
        <section className="bg-card border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((e) => (
              <li key={e.id} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <span
                    className={`inline-flex items-center px-[9px] py-[4px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider shrink-0 ${ACTION_TONE[e.action]}`}
                  >
                    {e.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] text-fg">
                      <span className="font-semibold">{userName.get(e.actorId) ?? e.actorId}</span>
                      <span className="text-fg-muted">{' · '}</span>
                      <span className="font-semibold">{appName.get(e.appId) ?? e.appId}</span>
                    </div>
                    {e.note && (
                      <p className="text-[12.5px] text-fg-muted mt-[3px]">{e.note}</p>
                    )}
                    <div
                      className="font-mono text-[10.5px] text-fg-subtle mt-[6px] uppercase tracking-wider"
                      title={absoluteTime(e.createdAt)}
                    >
                      <RelativeTime iso={e.createdAt} />
                      <span className="mx-[6px] text-line">·</span>
                      <span>{e.id}</span>
                      {e.teamId && (
                        <>
                          <span className="mx-[6px] text-line">·</span>
                          <span>{e.teamId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
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
    <div className="flex items-center gap-2 flex-wrap">
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
