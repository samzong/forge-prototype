import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Download,
  GitFork,
  Globe,
  Lock,
  Rocket,
  RotateCcw,
  Settings2,
  Share2,
  Trash2,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import type { App, AuditAction, AuditEvent } from '@/types'
import { useAuditEvents } from '@/hooks/useAuditEvents'
import { RelativeTime } from '@/components/RelativeTime'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'

interface Props {
  app: App
}

const ACTION_INFO: Record<
  AuditAction,
  { label: string; Icon: LucideIcon; tone: string }
> = {
  deploy: { label: 'Deploy', Icon: Rocket, tone: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]' },
  rollback: { label: 'Rollback', Icon: RotateCcw, tone: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]' },
  update: { label: 'Update', Icon: Settings2, tone: 'text-[#1d4ed8] bg-accent-ultra border-accent/20' },
  delete: { label: 'Delete', Icon: Trash2, tone: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]' },
  share: { label: 'Share', Icon: Share2, tone: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]' },
  unshare: { label: 'Unshare', Icon: Lock, tone: 'text-fg-muted bg-bg border-line' },
  fork: { label: 'Fork', Icon: GitFork, tone: 'text-[#0e7490] bg-[#cffafe] border-[#a5f3fc]' },
  subscribe: { label: 'Subscribe', Icon: UserPlus, tone: 'text-[#0369a1] bg-[#e0f2fe] border-[#bae6fd]' },
  unsubscribe: { label: 'Unsubscribe', Icon: UserMinus, tone: 'text-fg-muted bg-bg border-line' },
  publish: { label: 'Publish', Icon: Globe, tone: 'text-[#15803d] bg-[#dcfce7] border-[#bbf7d0]' },
  unpublish: { label: 'Unpublish', Icon: Download, tone: 'text-fg-muted bg-bg border-line' },
}

export function AuditTab({ app }: Props) {
  const { data, loading, error, refresh } = useAuditEvents({
    appId: app.id,
    sort: 'createdAt-desc',
  })
  const events = data?.items ?? []

  if (loading && events.length === 0) {
    return <LoadingState label="Loading audit trail…" className="p-8" />
  }
  if (error) {
    return <ErrorState error={error} onRetry={refresh} className="p-8" />
  }

  return (
    <div className="px-8 py-6 max-w-[1000px] mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-[0.1em]">
            Audit Trail
          </div>
          <h2 className="text-[18px] font-extrabold text-fg mt-1">
            Every lifecycle event for {app.name}
          </h2>
          <p className="text-[12.5px] text-fg-muted mt-2 max-w-[620px]">
            Deploys, rollbacks, updates, shares, and deletes — retained for 180 days per
            tenant policy. Newest first.
          </p>
        </div>
        <div className="font-mono text-[11px] text-fg-subtle uppercase tracking-wider shrink-0">
          {events.length} events
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          message="No audit events recorded"
          hint="Deploys, rollbacks, updates, shares, and deletes will appear here as the app evolves."
          icon={AlertTriangle}
        />
      ) : (
        <Timeline events={events} />
      )}
    </div>
  )
}

function Timeline({ events }: { events: AuditEvent[] }) {
  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-line" />
      <div className="space-y-3">
        {events.map((e, i) => (
          <TimelineRow key={e.id} event={e} index={i} />
        ))}
      </div>
    </div>
  )
}

function TimelineRow({ event, index }: { event: AuditEvent; index: number }) {
  const info = ACTION_INFO[event.action]
  const Icon = info.Icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 15) * 0.02 }}
      className="relative pl-[42px]"
    >
      <div
        className={`absolute left-0 top-[6px] w-[30px] h-[30px] rounded-full border flex items-center justify-center z-10 bg-card ${info.tone}`}
      >
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="bg-card border border-line rounded-[10px] p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-[2px] rounded-[6px] border text-[10.5px] font-mono font-bold uppercase tracking-wider ${info.tone}`}
            >
              {info.label}
            </span>
            {event.targetVersionId && (
              <span className="font-mono text-[11px] text-fg-muted">
                → <span className="text-fg font-semibold">{event.targetVersionId}</span>
              </span>
            )}
            {event.fromVersionId && (
              <span className="font-mono text-[11px] text-fg-subtle">
                (from <span className="text-fg-muted">{event.fromVersionId}</span>)
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-fg-subtle flex items-center gap-3 shrink-0">
            <span>
              by <span className="text-fg">{event.actorId}</span>
            </span>
            <span>·</span>
            <RelativeTime iso={event.createdAt} />
          </div>
        </div>
        {event.note && (
          <div className="mt-2 text-[12.5px] text-fg leading-[1.55]">{event.note}</div>
        )}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <MetadataBlock metadata={event.metadata} />
        )}
      </div>
    </motion.div>
  )
}

function MetadataBlock({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata)
  return (
    <div className="mt-3 pt-3 border-t border-line grid gap-[5px]">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2 text-[11px] font-mono">
          <span className="text-fg-subtle uppercase tracking-wider w-[140px] shrink-0">
            {k}
          </span>
          <span className="text-fg-muted break-all">{String(v)}</span>
        </div>
      ))}
    </div>
  )
}
