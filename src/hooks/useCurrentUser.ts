import type { User } from '@/types'
import { getCurrentUser } from '@/mock/users'
import { useAsync, type AsyncState } from './useAsync'

export function useCurrentUser(): AsyncState<User> {
  return useAsync(() => getCurrentUser(), [])
}
