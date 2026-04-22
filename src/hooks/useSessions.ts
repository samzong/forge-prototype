import { useMemo } from 'react'
import type { Session } from '@/types'
import type { ListResult } from '@/mock/store'
import { listSessions, getSession, type SessionQuery } from '@/mock/sessions'
import { useAsync, type AsyncState } from './useAsync'

export function useSessions(query: SessionQuery = {}): AsyncState<ListResult<Session>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listSessions(query), [key])
}

export function useSession(id: string | undefined): AsyncState<Session | null> {
  return useAsync(async () => {
    if (!id) return null
    return getSession(id)
  }, [id])
}
