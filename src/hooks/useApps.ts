import { useMemo } from 'react'
import type { App } from '@/types'
import type { ListResult } from '@/mock/store'
import { listApps, getApp, type AppQuery } from '@/mock/apps'
import { useAsync, type AsyncState } from './useAsync'

export function useApps(query: AppQuery = {}): AsyncState<ListResult<App>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listApps(query), [key])
}

export function useApp(id: string | undefined): AsyncState<App | null> {
  return useAsync(async () => {
    if (!id) return null
    return getApp(id)
  }, [id])
}
