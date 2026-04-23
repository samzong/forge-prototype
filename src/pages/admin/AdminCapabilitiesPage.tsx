import { useMemo, useState } from 'react'
import { ShieldCheck, Search } from 'lucide-react'
import type { CapAction, CapRisk } from '@/types'
import { useCapabilities } from '@/hooks/useCapabilities'
import { useIntegrations } from '@/hooks/useIntegrations'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'

type ActionFilter = CapAction | 'all'
type RiskFilter = CapRisk | 'all'

const ACTION_TONE: Record<CapAction, string> = {
  read: 'text-[#1d4ed8] bg-[#dbeafe] border-[#bfdbfe]',
  watch: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
  write: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  send: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  delete: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
}

const RISK_TONE: Record<CapRisk, string> = {
  low: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  medium: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  high: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
}

export default function AdminCapabilitiesPage() {
  const [action, setAction] = useState<ActionFilter>('all')
  const [risk, setRisk] = useState<RiskFilter>('all')
  const [search, setSearch] = useState('')
  const [includeDeprecated, setIncludeDeprecated] = useState(true)

  const query = useMemo(
    () => ({
      action: action === 'all' ? undefined : action,
      risk: risk === 'all' ? undefined : risk,
      search: search.trim() || undefined,
      includeDeprecated,
    }),
    [action, risk, search, includeDeprecated],
  )

  const { data, loading, error, refresh } = useCapabilities(query)
  const { data: integrationsRes } = useIntegrations()
  const rows = data?.items ?? []

  const integrationName = useMemo(() => {
    const map = new Map<string, string>()
    for (const i of integrationsRes?.items ?? []) {
      map.set(i.id, i.name)
    }
    return map
  }, [integrationsRes])

  const summary = useMemo(() => {
    let high = 0
    let deprecated = 0
    for (const c of rows) {
      if (c.risk === 'high') high++
      if (c.deprecated) deprecated++
    }
    return { total: rows.length, high, deprecated }
  }, [rows])

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div>
          <h2 className="text-[14px] font-extrabold text-fg">Capability catalog</h2>
          <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[520px]">
            Every fine-grained permission that apps can request. Deprecated
            entries remain visible for audit.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Total" value={summary.total} tone="text-fg" />
          <StatTile label="High risk" value={summary.high} tone="text-[#b91c1c]" />
          <StatTile label="Deprecated" value={summary.deprecated} tone="text-fg-muted" />
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-[14px] flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Action"
          value={action}
          onChange={(v) => setAction(v as ActionFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'read', label: 'Read' },
            { value: 'watch', label: 'Watch' },
            { value: 'write', label: 'Write' },
            { value: 'send', label: 'Send' },
            { value: 'delete', label: 'Delete' },
          ]}
        />
        <FilterGroup
          label="Risk"
          value={risk}
          onChange={(v) => setRisk(v as RiskFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
        <label className="inline-flex items-center gap-[6px] text-[12px] text-fg-muted">
          <input
            type="checkbox"
            checked={includeDeprecated}
            onChange={(e) => setIncludeDeprecated(e.target.checked)}
            className="accent-accent"
          />
          Show deprecated
        </label>
        <label className="ml-auto relative flex items-center min-w-[220px]">
          <Search size={13} className="absolute left-[10px] text-fg-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search id or name…"
            className="w-full pl-[30px] pr-3 py-[7px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle"
          />
        </label>
      </section>

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && rows.length === 0 ? (
        <LoadingState label="Loading capabilities…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          message="No capabilities match"
          hint="Clear filters or adjust the search."
        />
      ) : (
        <section className="bg-card border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-fg">
                        {c.displayName}
                      </span>
                      {c.deprecated && (
                        <span className="inline-flex items-center px-[8px] py-[2px] rounded-[6px] border font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted bg-bg border-line">
                          Deprecated
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11.5px] text-fg-muted mt-[2px]">{c.id}</div>
                    <p className="text-[12.5px] text-fg-muted mt-[6px]">{c.description}</p>
                    <div className="font-mono text-[10.5px] text-fg-subtle mt-[8px] uppercase tracking-wider flex items-center gap-[6px] flex-wrap">
                      <span>{c.category}</span>
                      <span className="text-line">·</span>
                      <span>{integrationName.get(c.integrationId) ?? c.integrationId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center px-[9px] py-[4px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider ${ACTION_TONE[c.action]}`}
                    >
                      {c.action}
                    </span>
                    <span
                      className={`inline-flex items-center px-[9px] py-[4px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider ${RISK_TONE[c.risk]}`}
                    >
                      {c.risk}
                    </span>
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
