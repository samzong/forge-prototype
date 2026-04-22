import { useMemo } from 'react'
import type { Share } from '@/types'
import type { ListResult } from '@/mock/store'
import { listShares, getShare, type ShareQuery } from '@/mock/shares'
import { useAsync, type AsyncState } from './useAsync'

export function useShares(query: ShareQuery = {}): AsyncState<ListResult<Share>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listShares(query), [key])
}

export function useShare(id: string | undefined): AsyncState<Share | null> {
  return useAsync(async () => {
    if (!id) return null
    return getShare(id)
  }, [id])
}
