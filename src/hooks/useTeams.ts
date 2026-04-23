import { useMemo } from 'react'
import type { Team } from '@/types'
import type { ListResult } from '@/mock/store'
import { listTeams, getTeam, type TeamQuery } from '@/mock/teams'
import { useAsync, type AsyncState } from './useAsync'

export function useTeams(query: TeamQuery = {}): AsyncState<ListResult<Team>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listTeams(query), [key])
}

export function useTeam(id: string | undefined): AsyncState<Team | null> {
  return useAsync(async () => {
    if (!id) return null
    return getTeam(id)
  }, [id])
}
