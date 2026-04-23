import { useMemo } from 'react'
import type { Integration } from '@/types'
import type { ListResult } from '@/mock/store'
import {
  listIntegrations,
  getIntegration,
  type IntegrationQuery,
} from '@/mock/integrations'
import { useAsync, type AsyncState } from './useAsync'

export function useIntegrations(
  query: IntegrationQuery = {},
): AsyncState<ListResult<Integration>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listIntegrations(query), [key])
}

export function useIntegration(
  id: string | undefined,
): AsyncState<Integration | null> {
  return useAsync(async () => {
    if (!id) return null
    return getIntegration(id)
  }, [id])
}
