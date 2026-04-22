import type { Notification, NotificationKind } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { notificationsSeed } from './seed/notifications'

const store = createStore<Notification>(notificationsSeed)

export interface NotificationQuery {
  page?: number
  size?: number
  userId?: string
  kind?: NotificationKind
  read?: boolean
  sort?: 'createdAt-desc' | 'createdAt-asc'
}

function buildListQuery(q: NotificationQuery = {}): ListQuery<Notification> {
  return {
    page: q.page,
    size: q.size,
    filter: (n) => {
      if (q.userId && n.userId !== q.userId) return false
      if (q.kind && n.kind !== q.kind) return false
      if (typeof q.read === 'boolean' && n.read !== q.read) return false
      return true
    },
    sort: (a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listNotifications(
  query: NotificationQuery = {},
): Promise<ListResult<Notification>> {
  await jitter()
  const err = shouldInject('notifications', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getNotification(id: string): Promise<Notification | null> {
  await jitter()
  const err = shouldInject('notifications', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export async function markNotificationRead(id: string): Promise<Notification> {
  await jitter()
  const err = shouldInject('notifications', 'markRead')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`markNotificationRead: id "${id}" not found`)
  if (existing.read) return existing
  return store.update(id, { read: true })
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  await jitter()
  const err = shouldInject('notifications', 'markAllRead')
  if (err) throw err
  let count = 0
  for (const n of store.all()) {
    if (n.userId === userId && !n.read) {
      store.update(n.id, { read: true })
      count++
    }
  }
  return count
}
