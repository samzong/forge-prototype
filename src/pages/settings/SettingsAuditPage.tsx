import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Filter,
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
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useAuditEvents } from '@/hooks/useAuditEvents'
import { useApps } from '@/hooks/useApps'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

const ACTION_INFO: Record<AuditAction, { label: string; Icon: LucideIcon; tone: string }> = {
  deploy: { label: 'Deploy', Icon: Rocket, tone: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]' },
  rollback: {
    label: 'Rollback',
    Icon: RotateCcw,
    tone: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  },
  update: {
    label: 'Update',
    Icon: Settings2,
    tone: 'text-[#1d4ed8] bg-accent-ultra border-accent/20',
  },
  delete: { label: 'Delete', Icon: Trash2, tone: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]' },
  share: { label: 'Share', Icon: Share2, tone: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]' },
  unshare: { label: 'Unshare', Icon: Lock, tone: 'text-fg-muted bg-bg border-line' },
  fork: { label: 'Fork', Icon: GitFork, tone: 'text-[#0e7490] bg-[#cffafe] border-[#a5f3fc]' },
  subscribe: {
    label: 'Subscribe',
    Icon: UserPlus,
    tone: 'text-[#0369a1] bg-[#e0f2fe] border-[#bae6fd]',
  },
  unsubscribe: { label: 'Unsubscribe', Icon: UserMinus, tone: 'text-fg-muted bg-bg border-line' },
  publish: {
    label: 'Publish',
    Icon: Globe,
    tone: 'text-[#15803d] bg-[#dcfce7] border-[#bbf7d0]',
  },
  unpublish: { label: 'Unpublish', Icon: Download, tone: 'text-fg-muted bg-bg border-line' },
}

const ALL_ACTIONS: AuditAction[] = Object.keys(ACTION_INFO) as AuditAction[]

type ActionFilter = 'all' | AuditAction

export default function SettingsAuditPage() {
  const { data: user } = useCurrentUser()
  const [filter, setFilter] = useState<ActionFilter>('all')

  const query = useMemo(() => {
    if (!user) return {}
    return {
      actorId: user.id,
      action: filter === 'all' ? undefined : filter,
      sort: 'createdAt-desc' as const,
      size: 100,
    }
  }, [user, filter])

  const { data, loading, error, refresh } = useAuditEvents(query)
  const events = data?.items ?? []
  const { data: appsData } = useApps({ size: 200 })

  const appMap = useMemo(() => {
    const m = new Map<string, App>()
    for (const a of appsData?.items ?? []) m.set(a.id, a)
    return m
  }, [appsData])

  const actionCounts = useMemo(() => {
    const c = new Map<AuditAction, number>()
    for (const e of events) c.set(e.action, (c.get(e.action) ?? 0) + 1)
    return c
  }, [events])

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-extrabold text-fg">Your recent activity</h2>
            <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[540px]">
              Every lifecycle action you triggered across the tenant — deploys, rollbacks,
              shares, forks. Retained for 180 days.
            </p>
          </div>
          <div className="font-mono text-[11px] text-fg-subtle uppercase tracking-wider shrink-0">
            {events.length} events
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-[5px] font-mono text-[10px] text-fg-subtle uppercase tracking-wider mr-1">
            <Filter size={11} strokeWidth={2} />
            Filter
          </span>
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="All"
            count={events.length}
          />
          {ALL_ACTIONS.map((a) => {
            const info = ACTION_INFO[a]
            return (
              <FilterChip
                key={a}
                active={filter === a}
                onClick={() => setFilter(a)}
                label={info.label}
                count={actionCounts.get(a)}
                tone={info.tone}
              />
            )
          })}
        </div>
      </section>

      {loading && events.length === 0 ? (
        <LoadingState label="Loading activity…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : events.length === 0 ? (
        <section className="bg-card border border-line rounded-xl p-6">
          <EmptyState
            message={
              filter === 'all'
                ? 'No activity yet'
                : `No ${ACTION_INFO[filter as AuditAction].label.toLowerCase()} events`
            }
            hint={
              filter === 'all'
                ? 'Deploys, rollbacks, and share events you trigger will appear here.'
                : 'Try a different filter or widen the scope to All.'
            }
            icon={AlertTriangle}
          />
        </section>
      ) : (
        <section className="bg-card border border-line rounded-xl p-6">
          <Timeline events={events} appMap={appMap} />
        </section>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean
  onClick: () => void
  label: string
  count?: number
  tone?: string
}) {
  const isEmpty = count === 0 || count === undefined
  return (
    <button
      onClick={onClick}
      disabled={isEmpty && !active && label !== 'All'}
      className={`inline-flex items-center gap-[6px] px-[10px] py-[5px] rounded-[7px] border font-mono text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
        active
          ? tone ?? 'text-accent bg-accent-ultra border-accent/30'
          : 'text-fg-muted bg-bg border-line hover:bg-line-soft'
      } ${isEmpty && !active && label !== 'All' ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`font-mono text-[9.5px] px-[5px] py-[1px] rounded-[4px] ${
            active ? 'bg-white/50' : 'bg-card border border-line'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function Timeline({
  events,
  appMap,
}: {
  events: AuditEvent[]
  appMap: Map<string, App>
}) {
  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-line" />
      <div className="space-y-3">
        {events.map((e, i) => (
          <TimelineRow key={e.id} event={e} index={i} app={appMap.get(e.appId)} />
        ))}
      </div>
    </div>
  )
}

function TimelineRow({
  event,
  index,
  app,
}: {
  event: AuditEvent
  index: number
  app: App | undefined
}) {
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
      <div className="bg-bg border border-line rounded-[10px] p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`px-2 py-[2px] rounded-[6px] border text-[10.5px] font-mono font-bold uppercase tracking-wider ${info.tone}`}
            >
              {info.label}
            </span>
            <Link
              to={`/apps/${event.appId}`}
              className="text-[13px] font-semibold text-fg hover:text-accent inline-flex items-center gap-[4px] truncate max-w-[340px]"
            >
              {app?.name ?? event.appId}
              <ExternalLink size={11} strokeWidth={2.5} className="shrink-0 text-fg-subtle" />
            </Link>
            {event.targetVersionId && (
              <span className="font-mono text-[11px] text-fg-muted shrink-0">
                → <span className="text-fg font-semibold">{event.targetVersionId}</span>
              </span>
            )}
            {event.fromVersionId && (
              <span className="font-mono text-[11px] text-fg-subtle shrink-0">
                (from <span className="text-fg-muted">{event.fromVersionId}</span>)
              </span>
            )}
          </div>
          <div
            className="font-mono text-[11px] text-fg-subtle shrink-0"
            title={absoluteTime(event.createdAt)}
          >
            <RelativeTime iso={event.createdAt} />
          </div>
        </div>
        {event.note && (
          <div className="mt-2 text-[12.5px] text-fg-muted leading-[1.55]">{event.note}</div>
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
          <span className="text-fg-subtle uppercase tracking-wider w-[140px] shrink-0">{k}</span>
          <span className="text-fg-muted break-all">{String(v)}</span>
        </div>
      ))}
    </div>
  )
}
