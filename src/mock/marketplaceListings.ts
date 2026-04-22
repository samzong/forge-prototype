import type { MarketplaceListing } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { marketplaceListingsSeed } from './seed/marketplaceListings'

const store = createStore<MarketplaceListing>(marketplaceListingsSeed)

export type MarketplaceCategory = 'all' | 'official' | 'community'
export type MarketplaceSort = 'stars-desc' | 'new' | 'name-asc'

export interface MarketplaceListingQuery {
  page?: number
  size?: number
  category?: MarketplaceCategory
  search?: string
  tag?: string
  sort?: MarketplaceSort
}

function isOfficial(listing: MarketplaceListing): boolean {
  return listing.tags.includes('official')
}

function buildListQuery(q: MarketplaceListingQuery = {}): ListQuery<MarketplaceListing> {
  const needle = q.search?.trim().toLowerCase()
  return {
    page: q.page,
    size: q.size,
    filter: (l) => {
      if (q.category && q.category !== 'all') {
        const official = isOfficial(l)
        if (q.category === 'official' && !official) return false
        if (q.category === 'community' && official) return false
      }
      if (q.tag && !l.tags.includes(q.tag)) return false
      if (needle) {
        const hay = `${l.appId} ${l.about} ${l.highlights.join(' ')} ${l.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    },
    sort: (a, b) => {
      switch (q.sort ?? 'stars-desc') {
        case 'new':
          return b.publishedAt.localeCompare(a.publishedAt)
        case 'name-asc':
          return a.appId.localeCompare(b.appId)
        case 'stars-desc':
        default:
          return b.stars - a.stars
      }
    },
  }
}

export async function listMarketplaceListings(
  query: MarketplaceListingQuery = {},
): Promise<ListResult<MarketplaceListing>> {
  await jitter()
  const err = shouldInject('marketplaceListings', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getMarketplaceListing(
  appId: string,
): Promise<MarketplaceListing | null> {
  await jitter()
  const err = shouldInject('marketplaceListings', 'get')
  if (err) throw err
  return store.get(appId) ?? null
}

export type CreateMarketplaceListingInput = Omit<MarketplaceListing, 'publishedAt'> & {
  publishedAt?: string
}

export async function createMarketplaceListing(
  input: CreateMarketplaceListingInput,
): Promise<MarketplaceListing> {
  await jitter()
  const err = shouldInject('marketplaceListings', 'create')
  if (err) throw err
  const listing: MarketplaceListing = {
    ...input,
    publishedAt: input.publishedAt ?? new Date().toISOString(),
  }
  return store.create(listing)
}

export async function updateMarketplaceListing(
  appId: string,
  patch: Partial<MarketplaceListing>,
): Promise<MarketplaceListing> {
  await jitter()
  const err = shouldInject('marketplaceListings', 'update')
  if (err) throw err
  return store.update(appId, patch)
}

export async function deleteMarketplaceListing(appId: string): Promise<boolean> {
  await jitter()
  const err = shouldInject('marketplaceListings', 'delete')
  if (err) throw err
  return store.delete(appId)
}

export function incrementForks(appId: string): void {
  const l = store.get(appId)
  if (!l) return
  store.update(appId, { forks: l.forks + 1 })
}

export function incrementSubscribers(appId: string): void {
  const l = store.get(appId)
  if (!l) return
  store.update(appId, { subscribers: l.subscribers + 1 })
}
