import { useMemo } from 'react'
import type { User } from '@/types'
import type { ListResult } from '@/mock/store'
import { listUsers, getUser, type UserQuery } from '@/mock/users'
import { useAsync, type AsyncState } from './useAsync'

export function useUsers(query: UserQuery = {}): AsyncState<ListResult<User>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listUsers(query), [key])
}

export function useUser(id: string | undefined): AsyncState<User | null> {
  return useAsync(async () => {
    if (!id) return null
    return getUser(id)
  }, [id])
}
