import { useMemo } from 'react'
import type { MarketplaceListing } from '@/types'
import type { ListResult } from '@/mock/store'
import {
  listMarketplaceListings,
  getMarketplaceListing,
  type MarketplaceListingQuery,
} from '@/mock/marketplaceListings'
import { useAsync, type AsyncState } from './useAsync'

export function useMarketplaceListings(
  query: MarketplaceListingQuery = {},
): AsyncState<ListResult<MarketplaceListing>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listMarketplaceListings(query), [key])
}

export function useMarketplaceListing(
  appId: string | undefined,
): AsyncState<MarketplaceListing | null> {
  return useAsync(async () => {
    if (!appId) return null
    return getMarketplaceListing(appId)
  }, [appId])
}
