import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, GitFork, Search, UserPlus, Users } from 'lucide-react'
import type { App } from '@/types'
import { useApps } from '@/hooks/useApps'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useShares } from '@/hooks/useShares'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'
import { RelativeTime } from '@/components/RelativeTime'

type FilterId = 'all' | 'subscribed' | 'forked'

const FILTERS: Array<{ id: FilterId; label: string; icon: typeof UserPlus }> = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'subscribed', label: 'Subscribed', icon: UserPlus },
  { id: 'forked', label: 'Forked', icon: GitFork },
]

export default function SharedListPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterId>('all')
  const [search, setSearch] = useState('')

  const appsState = useApps({ group: 'shared' })
  const user = useCurrentUser().data
  const sharesState = useShares({ sharedWithId: user?.id })

  const items = useMemo(() => {
    const apps = appsState.data?.items ?? []
    const needle = search.trim().toLowerCase()
    return apps.filter((app) => {
      if (filter !== 'all' && app.relation !== filter) return false
      if (needle) {
        const hay = `${app.name} ${app.description} ${app.ownerId}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [appsState.data, filter, search])

  const counts = useMemo(() => {
    const apps = appsState.data?.items ?? []
    return {
      all: apps.length,
      subscribed: apps.filter((a) => a.relation === 'subscribed').length,
      forked: apps.filter((a) => a.relation === 'forked').length,
    }
  }, [appsState.data])

  return (
    <div className="p-8">
      <div className="max-w-[1100px] mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-7">
          <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-3">
            Shared with me
          </div>
          <h1 className="text-[40px] font-black tracking-[-0.02em] leading-none">
            Subscriptions &amp; Forks
          </h1>
          <p className="text-fg-muted mt-4 max-w-[640px] text-[15px]">
            Apps you subscribed to stay in sync with upstream. Apps you forked live in your
            own workspace and diverge freely.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1 bg-card border border-line rounded-[9px] p-[3px]">
            {FILTERS.map((f) => {
              const Icon = f.icon
              const active = filter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-[6px] text-[12.5px] font-semibold rounded-[7px] flex items-center gap-[6px] transition-colors ${
                    active
                      ? 'bg-accent text-white'
                      : 'text-fg-muted hover:text-fg hover:bg-line-soft'
                  }`}
                >
                  <Icon size={13} />
                  {f.label}
                  <span
                    className={`font-mono text-[10px] rounded px-[5px] py-[1px] ${
                      active ? 'bg-white/20' : 'bg-bg border border-line text-fg-subtle'
                    }`}
                  >
                    {counts[f.id]}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shared apps…"
              className="pl-8 pr-3 py-[7px] w-[240px] bg-card border border-line rounded-[8px] text-[12.5px] placeholder:text-fg-subtle focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {appsState.loading && items.length === 0 ? (
          <LoadingState label="Loading shared apps…" className="py-20" />
        ) : appsState.error ? (
          <ErrorState error={appsState.error} onRetry={appsState.refresh} className="py-20" />
        ) : items.length === 0 ? (
          <EmptyState
            message={
              search.trim()
                ? `No shared apps match "${search}"`
                : filter === 'subscribed'
                  ? 'Nothing subscribed yet'
                  : filter === 'forked'
                    ? 'Nothing forked yet'
                    : 'Nothing shared with you yet'
            }
            hint="Visit the marketplace to subscribe or fork an app."
            ctaLabel="Browse marketplace →"
            onCta={() => navigate('/marketplace')}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((app, i) => (
              <SharedCard
                key={app.id}
                app={app}
                shareAt={sharesState.data?.items.find((s) => s.forkedAppId === app.id)?.createdAt}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SharedCard({ app, shareAt, index }: { app: App; shareAt?: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        to={`/shared/${app.id}`}
        className="block bg-card border border-line rounded-xl p-5 hover:border-accent hover:shadow-[0_12px_40px_-16px_rgba(37,99,235,0.2)] transition-all group h-full"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 bg-bg border border-line rounded-[10px] flex items-center justify-center font-mono text-sm font-extrabold text-fg-muted group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-colors shrink-0">
            {app.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-bold text-fg truncate">{app.name}</div>
              <RelationBadge relation={app.relation} />
            </div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[2px]">
              {app.currentVersion} · by {app.ownerId}
            </div>
          </div>
        </div>
        <p className="text-[13px] text-fg-muted mb-4 line-clamp-2 leading-relaxed">
          {app.description}
        </p>
        <div className="flex items-center justify-between text-xs pt-3 border-t border-line gap-2">
          <div className="text-fg-muted font-mono text-[10.5px]">
            {shareAt ? (
              <>Shared <RelativeTime iso={shareAt} /></>
            ) : (
              <>Updated <RelativeTime iso={app.updatedAt} /></>
            )}
          </div>
          <span className="text-accent font-semibold group-hover:underline shrink-0">Open →</span>
        </div>
      </Link>
    </motion.div>
  )
}

function RelationBadge({ relation }: { relation?: App['relation'] }) {
  if (!relation) return null
  const palette =
    relation === 'forked'
      ? 'text-[#0e7490] bg-[#cffafe] border-[#a5f3fc]'
      : 'text-[#0369a1] bg-[#e0f2fe] border-[#bae6fd]'
  return (
    <span
      className={`font-mono text-[9px] px-[6px] py-[1px] rounded border font-bold uppercase tracking-wider shrink-0 ${palette}`}
    >
      {relation}
    </span>
  )
}
