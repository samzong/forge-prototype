import { useEffect, useState } from 'react'
import type { User } from '@/types'
import { ACTIVE_USER_CHANGED_EVENT, getCurrentUser } from '@/mock/users'
import { useAsync, type AsyncState } from './useAsync'

export function useCurrentUser(): AsyncState<User> {
  const [nonce, setNonce] = useState(0)
  useEffect(() => {
    const handler = () => setNonce((n) => n + 1)
    window.addEventListener(ACTIVE_USER_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ACTIVE_USER_CHANGED_EVENT, handler)
  }, [])
  return useAsync(() => getCurrentUser(), [nonce])
}
