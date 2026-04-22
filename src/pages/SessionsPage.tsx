import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useSessions } from '@/hooks/useSessions'
import type { SessionQuery } from '@/mock/sessions'
import type { Session, SessionStatus } from '@/types'
import { RelativeTime } from '@/components/RelativeTime'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'

type SortKey = NonNullable<SessionQuery['sort']>
type StatusFilter = 'all' | SessionStatus

const PAGE_SIZE = 20

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'createdAt-desc', label: 'Newest first' },
  { value: 'createdAt-asc', label: 'Oldest first' },
]

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Any status' },
  { value: 'running', label: 'Running' },
  { value: 'awaiting-confirm', label: 'Awaiting confirm' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_BADGE: Record<SessionStatus, string> = {
  running: 'bg-accent/10 text-accent border-accent/20',
  'awaiting-confirm': 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
  completed: 'bg-[#d1fae5] text-[#047857] border-[#a7f3d0]',
  failed: 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]',
  cancelled: 'bg-line-soft text-fg-muted border-line',
}

export default function SessionsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('createdAt-desc')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 200)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sort, status])

  const query: SessionQuery = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sort,
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
    }),
    [page, sort, debouncedSearch, status],
  )

  const { data, loading, error, refresh } = useSessions(query)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6">
          <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-3">
            Generate Activity
          </div>
          <h1 className="text-[32px] font-black tracking-[-0.02em] leading-none">
            Sessions
          </h1>
          <p className="text-fg-muted mt-3 text-[14px]">
            Every app starts here — each session is a prompt walked through the
            7-stage pipeline. Open one to replay its lineage.
          </p>
        </div>

        <Toolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onClearSearch={() => setSearchInput('')}
          sort={sort}
          onSortChange={setSort}
          status={status}
          onStatusChange={setStatus}
        />

        <ResultSummary total={total} page={page} size={PAGE_SIZE} loading={loading} />

        {error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : loading && items.length === 0 ? (
          <LoadingState label="Loading sessions…" />
        ) : items.length === 0 ? (
          <EmptyState
            message="No sessions match your filters"
            hint="Adjust search or clear the filters."
            ctaLabel="Clear filters"
            onCta={() => {
              setSearchInput('')
              setStatus('all')
            }}
          />
        ) : (
          <>
            <SessionList items={items} />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

function Toolbar({
  searchInput,
  onSearchChange,
  onClearSearch,
  sort,
  onSortChange,
  status,
  onStatusChange,
}: {
  searchInput: string
  onSearchChange: (v: string) => void
  onClearSearch: () => void
  sort: SortKey
  onSortChange: (v: SortKey) => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
}) {
  return (
    <div className="bg-card border border-line rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
          strokeWidth={2}
        />
        <input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search prompt text…"
          className="w-full pl-9 pr-9 py-[9px] bg-bg border border-line rounded-[9px] text-[13px] outline-none focus:border-accent transition-colors"
        />
        {searchInput && (
          <button
            onClick={onClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-[5px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <Select label="Status" value={status} onChange={onStatusChange} options={STATUS_OPTIONS} />
      <Select label="Sort" value={sort} onChange={onSortChange} options={SORT_OPTIONS} />
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

function ResultSummary({
  total,
  page,
  size,
  loading,
}: {
  total: number
  page: number
  size: number
  loading: boolean
}) {
  if (loading && total === 0) return null
  if (total === 0) return null
  const start = (page - 1) * size + 1
  const end = Math.min(total, page * size)
  return (
    <div className="font-mono text-[11px] text-fg-subtle uppercase tracking-wider mb-3">
      Showing {start}–{end} of {total}
    </div>
  )
}

function SessionList({ items }: { items: Session[] }) {
  return (
    <div className="space-y-2">
      {items.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i, 12) * 0.02 }}
        >
          <Link
            to={`/generate/${s.id}`}
            className="block bg-card border border-line rounded-xl p-4 hover:border-accent hover:shadow-[0_8px_28px_-14px_rgba(37,99,235,0.2)] transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] text-fg font-medium leading-snug line-clamp-2">
                  &ldquo;{s.prompt}&rdquo;
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11.5px] font-mono text-fg-subtle">
                  <span>{s.id}</span>
                  <span>·</span>
                  <RelativeTime iso={s.createdAt} />
                  {s.resultAppId && (
                    <>
                      <span>·</span>
                      <span>app: {s.resultAppId}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span
                  className={`px-2 py-[3px] rounded-[6px] border text-[10.5px] font-mono font-semibold uppercase tracking-wider ${STATUS_BADGE[s.status]}`}
                >
                  {s.status}
                </span>
                <span className="text-accent font-semibold text-[12.5px] group-hover:underline">
                  Open →
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
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
    <div className="mt-6 flex items-center justify-center gap-2 text-[12.5px] font-mono">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-[7px] border border-line rounded-[7px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card-muted transition-colors"
      >
        <ChevronLeft size={13} /> Prev
      </button>
      <span className="text-fg-muted uppercase tracking-wider">
        Page {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-[7px] border border-line rounded-[7px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card-muted transition-colors"
      >
        Next <ChevronRight size={13} />
      </button>
    </div>
  )
}
