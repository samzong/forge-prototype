import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Star, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useApps } from '@/hooks/useApps'
import type { AppQuery } from '@/mock/apps'
import type { App, AppGroup, AppStatus } from '@/types'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'

type SortKey = NonNullable<AppQuery['sort']>
type GroupFilter = 'all' | AppGroup
type StatusFilter = 'all' | AppStatus

const PAGE_SIZE = 20

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'updatedAt-desc', label: 'Recently updated' },
  { value: 'createdAt-desc', label: 'Newest' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'stars-desc', label: 'Most stars' },
]

const GROUP_OPTIONS: Array<{ value: GroupFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'shared', label: 'Shared' },
  { value: 'marketplace', label: 'Marketplace' },
]

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Any status' },
  { value: 'running', label: 'Running' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'draft', label: 'Draft' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'failed', label: 'Failed' },
]

export default function AppsListPage() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('updatedAt-desc')
  const [group, setGroup] = useState<GroupFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 200)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sort, group, status])

  const query: AppQuery = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      sort,
      search: debouncedSearch || undefined,
      group: group === 'all' ? undefined : group,
      status: status === 'all' ? undefined : status,
    }),
    [page, sort, debouncedSearch, group, status],
  )

  const { data, loading, error, refresh } = useApps(query)
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-6">
          <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-3">
            Browse Apps
          </div>
          <h1 className="text-[32px] font-black tracking-[-0.02em] leading-none">All Apps</h1>
          <p className="text-fg-muted mt-3 text-[14px]">
            Search, filter, and open any app across your workspace.
          </p>
        </div>

        <Toolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onClearSearch={() => setSearchInput('')}
          sort={sort}
          onSortChange={setSort}
          group={group}
          onGroupChange={setGroup}
          status={status}
          onStatusChange={setStatus}
        />

        <ResultSummary total={total} page={page} size={PAGE_SIZE} loading={loading} />

        {error ? (
          <ErrorState error={error} onRetry={refresh} />
        ) : loading && items.length === 0 ? (
          <LoadingState label="Loading apps…" />
        ) : items.length === 0 ? (
          <EmptyState
            message="No apps match your filters"
            hint="Try a different search term or clear the filters."
            ctaLabel="Clear filters"
            onCta={() => {
              setSearchInput('')
              setGroup('all')
              setStatus('all')
            }}
          />
        ) : (
          <>
            <AppGrid items={items} />
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
  group,
  onGroupChange,
  status,
  onStatusChange,
}: {
  searchInput: string
  onSearchChange: (v: string) => void
  onClearSearch: () => void
  sort: SortKey
  onSortChange: (v: SortKey) => void
  group: GroupFilter
  onGroupChange: (v: GroupFilter) => void
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
          placeholder="Search by name or description…"
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

      <Select label="Group" value={group} onChange={onGroupChange} options={GROUP_OPTIONS} />
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

function AppGrid({ items }: { items: App[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((app, i) => (
        <motion.div
          key={app.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i, 12) * 0.03 }}
        >
          <Link
            to={`/apps/${app.id}`}
            className="block bg-card border border-line rounded-xl p-5 hover:border-accent hover:shadow-[0_12px_40px_-16px_rgba(37,99,235,0.2)] transition-all group"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 bg-bg border border-line rounded-[10px] flex items-center justify-center font-mono text-sm font-extrabold text-fg-muted group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-colors shrink-0">
                {app.icon}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-fg truncate">{app.name}</div>
                <div className="font-mono text-[10px] text-fg-subtle mt-[2px] truncate">
                  {app.currentVersion} · {app.status}
                </div>
              </div>
            </div>
            <p className="text-[13px] text-fg-muted mb-4 line-clamp-2 leading-relaxed">
              {app.description}
            </p>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-line">
              <span className="flex items-center gap-1 text-fg-muted font-semibold">
                {app.group === 'marketplace' ? (
                  <>
                    <Star size={13} className="fill-current" />
                    {formatStars(app.stars ?? 0)}
                  </>
                ) : (
                  <span className="uppercase tracking-wider font-mono text-[10px]">{app.group}</span>
                )}
              </span>
              <span className="text-accent font-semibold group-hover:underline">View →</span>
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
  const canPrev = page > 1
  const canNext = page < totalPages
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <PageButton disabled={!canPrev} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft size={14} />
      </PageButton>
      <span className="font-mono text-[12px] text-fg-muted px-3">
        {page} / {totalPages}
      </span>
      <PageButton disabled={!canNext} onClick={() => onChange(page + 1)} aria-label="Next page">
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

function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}
