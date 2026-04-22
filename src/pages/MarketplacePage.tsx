import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, GitFork, Plus, Search, Star, Users } from 'lucide-react'
import type { App, MarketplaceListing } from '@/types'
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings'
import { useApps } from '@/hooks/useApps'
import {
  type MarketplaceCategory,
  type MarketplaceSort,
} from '@/mock/marketplaceListings'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'

const CATEGORIES: Array<{ id: MarketplaceCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'official', label: 'Official' },
  { id: 'community', label: 'Community' },
]

const SORTS: Array<{ id: MarketplaceSort; label: string }> = [
  { id: 'stars-desc', label: 'Most starred' },
  { id: 'new', label: 'Recently published' },
  { id: 'name-asc', label: 'Name (A–Z)' },
]

export default function MarketplacePage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<MarketplaceCategory>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<MarketplaceSort>('stars-desc')

  const query = useMemo(
    () => ({ category, search, sort }),
    [category, search, sort],
  )
  const listingsState = useMarketplaceListings(query)
  const appsState = useApps({})
  const listings = listingsState.data?.items ?? []
  const apps = appsState.data?.items ?? []
  const appById = useMemo(() => {
    const m = new Map<string, App>()
    for (const a of apps) m.set(a.id, a)
    return m
  }, [apps])

  const loading = listingsState.loading || appsState.loading
  const error = listingsState.error ?? appsState.error

  return (
    <div className="p-8">
      <div className="max-w-[1100px] mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium flex items-center gap-[6px] transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-end justify-between gap-6 mb-7 flex-wrap">
          <div>
            <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-3">
              Enterprise Marketplace
            </div>
            <h1 className="text-[40px] font-black tracking-[-0.02em] leading-none">
              Official &amp; Community Apps
            </h1>
            <p className="text-fg-muted mt-4 max-w-[640px] text-[15px]">
              Fork any app to customize for your team, subscribe to upstream updates, or publish
              your own to the company marketplace.
            </p>
          </div>
          <button
            onClick={() => navigate('/marketplace/publish')}
            className="px-[14px] py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] transition-colors shrink-0"
          >
            <Plus size={14} /> Publish App
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1 bg-card border border-line rounded-[9px] p-[3px]">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-[6px] text-[12.5px] font-semibold rounded-[7px] transition-colors ${
                  category === c.id
                    ? 'bg-accent text-white'
                    : 'text-fg-muted hover:text-fg hover:bg-line-soft'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings…"
                className="pl-8 pr-3 py-[7px] w-[240px] bg-card border border-line rounded-[8px] text-[12.5px] placeholder:text-fg-subtle focus:outline-none focus:border-accent"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as MarketplaceSort)}
              className="px-3 py-[7px] bg-card border border-line rounded-[8px] text-[12.5px] font-medium text-fg focus:outline-none focus:border-accent"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && listings.length === 0 ? (
          <LoadingState label="Loading marketplace…" className="py-20" />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              listingsState.refresh()
              appsState.refresh()
            }}
            className="py-20"
          />
        ) : listings.length === 0 ? (
          <EmptyState
            message={
              search.trim()
                ? `No listings match "${search}"`
                : 'No listings in this category yet'
            }
            hint="Try a different category or clear the search."
          />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {listings.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                app={appById.get(listing.appId)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface CardProps {
  listing: MarketplaceListing
  app?: App
  index: number
}

function ListingCard({ listing, app, index }: CardProps) {
  const official = listing.tags.includes('official')
  const formattedStars =
    listing.stars >= 1000 ? `${(listing.stars / 1000).toFixed(1)}k` : String(listing.stars)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        to={`/marketplace/${listing.appId}`}
        className="block bg-card border border-line rounded-xl p-5 hover:border-accent hover:shadow-[0_12px_40px_-16px_rgba(37,99,235,0.2)] transition-all group h-full"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 bg-bg border border-line rounded-[10px] flex items-center justify-center font-mono text-sm font-extrabold text-fg-muted group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-colors shrink-0">
            {app?.icon ?? '??'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-bold text-fg truncate">{app?.name ?? listing.appId}</div>
              {official && (
                <span className="font-mono text-[9px] px-[6px] py-[1px] bg-accent-ultra text-accent border border-accent/20 rounded font-bold uppercase tracking-wider shrink-0">
                  Official
                </span>
              )}
            </div>
            <div className="font-mono text-[10px] text-fg-subtle mt-[2px]">
              {app?.currentVersion ?? '—'} · {listing.publisherId}
            </div>
          </div>
        </div>
        <p className="text-[13px] text-fg-muted mb-4 line-clamp-2 leading-relaxed">
          {app?.description ?? listing.about}
        </p>
        <div className="flex items-center justify-between text-xs pt-3 border-t border-line gap-2">
          <div className="flex items-center gap-3 text-fg-muted">
            <span className="flex items-center gap-[4px] font-semibold">
              <Star size={13} className="fill-current" /> {formattedStars}
            </span>
            <span className="flex items-center gap-[4px] font-mono">
              <GitFork size={12} /> {listing.forks}
            </span>
            <span className="flex items-center gap-[4px] font-mono">
              <Users size={12} /> {listing.subscribers}
            </span>
          </div>
          <span className="text-accent font-semibold group-hover:underline shrink-0">View →</span>
        </div>
      </Link>
    </motion.div>
  )
}
