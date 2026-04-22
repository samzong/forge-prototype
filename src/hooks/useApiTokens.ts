import { useMemo } from 'react'
import type { ApiToken } from '@/types'
import type { ListResult } from '@/mock/store'
import {
  listApiTokens,
  getApiToken,
  type ApiTokenQuery,
} from '@/mock/apiTokens'
import { useAsync, type AsyncState } from './useAsync'

export function useApiTokens(
  query: ApiTokenQuery = {},
): AsyncState<ListResult<ApiToken>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listApiTokens(query), [key])
}

export function useApiToken(id: string | undefined): AsyncState<ApiToken | null> {
  return useAsync(async () => {
    if (!id) return null
    return getApiToken(id)
  }, [id])
}
