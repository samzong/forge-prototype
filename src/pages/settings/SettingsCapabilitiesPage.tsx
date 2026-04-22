import { useMemo } from 'react'
import {
  AlertTriangle,
  Eye,
  MessageSquare,
  Radio,
  ShieldAlert,
  Trash2,
  Pencil,
  type LucideIcon,
} from 'lucide-react'
import type { CapAction, CapRisk, Capability } from '@/types'
import { useCapabilities } from '@/hooks/useCapabilities'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'

const ACTION_INFO: Record<CapAction, { Icon: LucideIcon; label: string; tone: string }> = {
  read: { Icon: Eye, label: 'read', tone: 'text-fg-muted bg-bg border-line' },
  watch: { Icon: Radio, label: 'watch', tone: 'text-[#1d4ed8] bg-accent-ultra border-accent/20' },
  write: {
    Icon: Pencil,
    label: 'write',
    tone: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  },
  send: {
    Icon: MessageSquare,
    label: 'send',
    tone: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
  },
  delete: {
    Icon: Trash2,
    label: 'delete',
    tone: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
  },
}

const RISK_INFO: Record<CapRisk, { tone: string; label: string }> = {
  low: { tone: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]', label: 'low' },
  medium: { tone: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]', label: 'medium' },
  high: { tone: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]', label: 'high' },
}

const CATEGORY_LABEL: Record<string, string> = {
  dce: 'DCE — observability & platform',
  crm: 'CRM — sales & customers',
  hr: 'HR — people & org',
  feishu: 'Feishu — messaging & calendar',
  github: 'GitHub — code & releases',
}

export default function SettingsCapabilitiesPage() {
  const { data, loading, error, refresh } = useCapabilities()
  const items = data?.items ?? []

  const grouped = useMemo(() => {
    const map = new Map<string, Capability[]>()
    for (const cap of items) {
      const arr = map.get(cap.category) ?? []
      arr.push(cap)
      map.set(cap.category, arr)
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          Number(!!a.deprecated) - Number(!!b.deprecated) || a.id.localeCompare(b.id),
      )
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [items])

  const deprecatedCount = items.filter((c) => c.deprecated).length

  if (loading && items.length === 0) return <LoadingState label="Loading capabilities…" />
  if (error) return <ErrorState error={error} onRetry={refresh} />

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-extrabold text-fg">Granted capabilities</h2>
            <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[540px]">
              Every app runs with your identity. These integrations are the raw set Forge can
              ask for — actual usage depends on the policy gate and the app's manifest.
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-fg-subtle uppercase tracking-wider shrink-0">
            <span>{items.length} caps</span>
            {deprecatedCount > 0 && (
              <span className="text-[#b91c1c]">{deprecatedCount} deprecated</span>
            )}
          </div>
        </div>
        {items.length === 0 && (
          <EmptyState
            message="No capabilities configured"
            hint="Your admin has not enabled any integrations for this tenant yet."
          />
        )}
      </section>

      {grouped.map(([category, caps]) => (
        <section key={category} className="bg-card border border-line rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] text-fg-subtle uppercase tracking-[0.1em]">
                {category}
              </div>
              <h3 className="text-[13.5px] font-extrabold text-fg mt-[2px]">
                {CATEGORY_LABEL[category] ?? category}
              </h3>
            </div>
            <span className="font-mono text-[10.5px] text-fg-subtle uppercase tracking-wider">
              {caps.length} caps
            </span>
          </div>
          <ul className="divide-y divide-line">
            {caps.map((c) => (
              <CapabilityRow key={c.id} cap={c} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function CapabilityRow({ cap }: { cap: Capability }) {
  const action = ACTION_INFO[cap.action]
  const risk = RISK_INFO[cap.risk]
  const ActionIcon = action.Icon
  return (
    <li className="px-6 py-4 flex items-start gap-4">
      <div
        className={`w-[30px] h-[30px] rounded-[8px] border flex items-center justify-center shrink-0 ${action.tone}`}
      >
        <ActionIcon size={13} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-mono text-[12.5px] font-semibold ${cap.deprecated ? 'line-through text-fg-subtle' : 'text-fg'}`}
          >
            {cap.id}
          </span>
          {cap.deprecated && (
            <span className="font-mono text-[10px] text-[#b91c1c] bg-[#fee2e2] border border-[#fecaca] px-[6px] py-[1px] rounded-[5px] uppercase tracking-wider font-bold inline-flex items-center gap-1">
              <AlertTriangle size={10} strokeWidth={2.5} />
              deprecated
            </span>
          )}
          <span
            className={`font-mono text-[10px] px-[6px] py-[1px] rounded-[5px] border uppercase tracking-wider font-bold ${risk.tone}`}
          >
            <ShieldAlert size={10} strokeWidth={2} className="inline mr-[3px] -mt-[1px]" />
            {risk.label}
          </span>
          <span
            className={`font-mono text-[10px] px-[6px] py-[1px] rounded-[5px] border uppercase tracking-wider font-bold ${action.tone}`}
          >
            {action.label}
          </span>
        </div>
        <div className="text-[13px] text-fg font-medium mt-[3px]">{cap.displayName}</div>
        <div className="text-[12.5px] text-fg-muted mt-[2px] leading-[1.5]">
          {cap.description}
        </div>
        <div className="font-mono text-[10.5px] text-fg-subtle mt-[5px]">
          via {cap.integrationId}
        </div>
      </div>
    </li>
  )
}
