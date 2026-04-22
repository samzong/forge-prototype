import type { DeliveryChannel, DeliveryChannelKind } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { deliveryChannelsSeed } from './seed/deliveryChannels'

const store = createStore<DeliveryChannel>(deliveryChannelsSeed)

export interface DeliveryChannelQuery {
  page?: number
  size?: number
  userId?: string
  kind?: DeliveryChannelKind
  enabled?: boolean
  sort?: 'createdAt-desc' | 'createdAt-asc'
}

function buildListQuery(q: DeliveryChannelQuery = {}): ListQuery<DeliveryChannel> {
  return {
    page: q.page,
    size: q.size,
    filter: (c) => {
      if (q.userId && c.userId !== q.userId) return false
      if (q.kind && c.kind !== q.kind) return false
      if (typeof q.enabled === 'boolean' && c.enabled !== q.enabled) return false
      return true
    },
    sort: (a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listDeliveryChannels(
  query: DeliveryChannelQuery = {},
): Promise<ListResult<DeliveryChannel>> {
  await jitter()
  const err = shouldInject('deliveryChannels', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getDeliveryChannel(id: string): Promise<DeliveryChannel | null> {
  await jitter()
  const err = shouldInject('deliveryChannels', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export async function verifyDeliveryChannel(id: string): Promise<DeliveryChannel> {
  await jitter()
  const err = shouldInject('deliveryChannels', 'verify')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`verifyDeliveryChannel: id "${id}" not found`)
  return store.update(id, {
    verifiedAt: new Date().toISOString(),
    enabled: true,
  })
}

export async function toggleDeliveryChannel(
  id: string,
  enabled: boolean,
): Promise<DeliveryChannel> {
  await jitter()
  const err = shouldInject('deliveryChannels', 'toggle')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`toggleDeliveryChannel: id "${id}" not found`)
  return store.update(id, { enabled })
}

export async function updateDeliveryChannelEvents(
  id: string,
  events: string[],
): Promise<DeliveryChannel> {
  await jitter()
  const err = shouldInject('deliveryChannels', 'updateEvents')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`updateDeliveryChannelEvents: id "${id}" not found`)
  return store.update(id, { events })
}
