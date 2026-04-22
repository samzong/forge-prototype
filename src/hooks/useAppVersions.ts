import { useMemo } from 'react'
import type { AppVersion } from '@/types'
import type { ListResult } from '@/mock/store'
import { listAppVersions, getAppVersion, type AppVersionQuery } from '@/mock/appVersions'
import { useAsync, type AsyncState } from './useAsync'

export function useAppVersions(
  query: AppVersionQuery = {},
): AsyncState<ListResult<AppVersion>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listAppVersions(query), [key])
}

export function useAppVersion(id: string | undefined): AsyncState<AppVersion | null> {
  return useAsync(async () => {
    if (!id) return null
    return getAppVersion(id)
  }, [id])
}
