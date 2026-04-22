import { useEffect, useMemo } from 'react'
import type { Session } from '@/types'
import type { ListResult } from '@/mock/store'
import { listSessions, getSession, type SessionQuery } from '@/mock/sessions'
import { useAsync, type AsyncState } from './useAsync'

export function useSessions(query: SessionQuery = {}): AsyncState<ListResult<Session>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listSessions(query), [key])
}

const TERMINAL_STATUSES: readonly Session['status'][] = [
  'completed',
  'failed',
  'cancelled',
]

export interface UseSessionOptions {
  pollMs?: number
}

export function useSession(
  id: string | undefined,
  opts: UseSessionOptions = {},
): AsyncState<Session | null> {
  const state = useAsync(async () => {
    if (!id) return null
    return getSession(id)
  }, [id])

  const status = state.data?.status
  const pollMs = opts.pollMs
  const { refresh } = state

  useEffect(() => {
    if (!pollMs || !id) return
    if (status && TERMINAL_STATUSES.includes(status)) return
    const t = setInterval(refresh, pollMs)
    return () => clearInterval(t)
  }, [id, pollMs, status, refresh])

  return state
}
