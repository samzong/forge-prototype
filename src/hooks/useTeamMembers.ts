import { useMemo } from 'react'
import type { User } from '@/types'
import type { ListResult } from '@/mock/store'
import { listUsers, type UserQuery } from '@/mock/users'
import { useAsync, type AsyncState } from './useAsync'

export function useTeamMembers(
  teamId: string | undefined,
  query: Omit<UserQuery, 'teamId'> = {},
): AsyncState<ListResult<User>> {
  const key = useMemo(
    () => JSON.stringify({ teamId, ...query }),
    [teamId, query],
  )
  return useAsync(async () => {
    if (!teamId) return { items: [], total: 0 }
    return listUsers({ ...query, teamId })
  }, [key])
}
