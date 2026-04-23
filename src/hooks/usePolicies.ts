import { useMemo } from 'react'
import type { Policy } from '@/types'
import type { ListResult } from '@/mock/store'
import { listPolicies, getPolicy, type PolicyQuery } from '@/mock/policies'
import { useAsync, type AsyncState } from './useAsync'

export function usePolicies(
  query: PolicyQuery = {},
): AsyncState<ListResult<Policy>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listPolicies(query), [key])
}

export function usePolicy(id: string | undefined): AsyncState<Policy | null> {
  return useAsync(async () => {
    if (!id) return null
    return getPolicy(id)
  }, [id])
}
