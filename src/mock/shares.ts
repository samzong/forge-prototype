import type { Share } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { sharesSeed } from './seed/shares'

const store = createStore<Share>(sharesSeed)

export interface ShareQuery {
  page?: number
  size?: number
  appId?: string
  sharedBy?: string
  sharedWithId?: string
  sharedWithKind?: Share['sharedWithKind']
  relation?: Share['relation']
  sort?: 'createdAt-desc' | 'createdAt-asc'
}

function buildListQuery(q: ShareQuery = {}): ListQuery<Share> {
  return {
    page: q.page,
    size: q.size,
    filter: (s) => {
      if (q.appId && s.appId !== q.appId) return false
      if (q.sharedBy && s.sharedBy !== q.sharedBy) return false
      if (q.sharedWithId && s.sharedWithId !== q.sharedWithId) return false
      if (q.sharedWithKind && s.sharedWithKind !== q.sharedWithKind) return false
      if (q.relation && s.relation !== q.relation) return false
      return true
    },
    sort: (a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listShares(query: ShareQuery = {}): Promise<ListResult<Share>> {
  await jitter()
  const err = shouldInject('shares', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getShare(id: string): Promise<Share | null> {
  await jitter()
  const err = shouldInject('shares', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export type CreateShareInput = Omit<Share, 'createdAt'> & { createdAt?: string }

export async function createShare(input: CreateShareInput): Promise<Share> {
  await jitter()
  const err = shouldInject('shares', 'create')
  if (err) throw err
  const share: Share = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
  return store.create(share)
}

export async function deleteShare(id: string): Promise<boolean> {
  await jitter()
  const err = shouldInject('shares', 'delete')
  if (err) throw err
  return store.delete(id)
}

export function recordShare(
  input: Omit<Share, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Share {
  const nowIso = new Date().toISOString()
  const id = input.id ?? `share-${Math.random().toString(36).slice(2, 10)}`
  const share: Share = {
    ...input,
    id,
    createdAt: input.createdAt ?? nowIso,
  }
  return store.create(share)
}
