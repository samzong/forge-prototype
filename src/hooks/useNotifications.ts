import { useMemo } from 'react'
import type { Notification } from '@/types'
import type { ListResult } from '@/mock/store'
import {
  listNotifications,
  getNotification,
  type NotificationQuery,
} from '@/mock/notifications'
import { useAsync, type AsyncState } from './useAsync'

export function useNotifications(
  query: NotificationQuery = {},
): AsyncState<ListResult<Notification>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listNotifications(query), [key])
}

export function useNotification(
  id: string | undefined,
): AsyncState<Notification | null> {
  return useAsync(async () => {
    if (!id) return null
    return getNotification(id)
  }, [id])
}
