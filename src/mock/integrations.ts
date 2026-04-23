import type { Integration, IntegrationKind, IntegrationStatus } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { integrationsSeed } from './seed/integrations'

const store = createStore<Integration>(integrationsSeed)

export interface IntegrationQuery {
  page?: number
  size?: number
  tenantId?: string
  kind?: IntegrationKind
  status?: IntegrationStatus
  search?: string
  sort?: 'createdAt-desc' | 'createdAt-asc' | 'updatedAt-desc' | 'name-asc'
}

function buildListQuery(q: IntegrationQuery = {}): ListQuery<Integration> {
  const needle = q.search?.trim().toLowerCase()
  return {
    page: q.page,
    size: q.size,
    filter: (i) => {
      if (q.tenantId && i.tenantId !== q.tenantId) return false
      if (q.kind && i.kind !== q.kind) return false
      if (q.status && i.status !== q.status) return false
      if (needle) {
        const hay = `${i.name} ${i.endpoint ?? ''} ${i.note ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    },
    sort: (a, b) => {
      switch (q.sort ?? 'updatedAt-desc') {
        case 'createdAt-asc':
          return a.createdAt.localeCompare(b.createdAt)
        case 'createdAt-desc':
          return b.createdAt.localeCompare(a.createdAt)
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'updatedAt-desc':
        default:
          return b.updatedAt.localeCompare(a.updatedAt)
      }
    },
  }
}

export async function listIntegrations(
  query: IntegrationQuery = {},
): Promise<ListResult<Integration>> {
  await jitter()
  const err = shouldInject('integrations', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getIntegration(id: string): Promise<Integration | null> {
  await jitter()
  const err = shouldInject('integrations', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export type CreateIntegrationInput = Omit<
  Integration,
  'id' | 'createdAt' | 'updatedAt' | 'status'
> & {
  id?: string
  status?: IntegrationStatus
}

export async function createIntegration(
  input: CreateIntegrationInput,
): Promise<Integration> {
  await jitter()
  const err = shouldInject('integrations', 'create')
  if (err) throw err
  const now = new Date().toISOString()
  const id = input.id ?? `int-${Math.random().toString(36).slice(2, 8)}`
  const integration: Integration = {
    ...input,
    id,
    status: input.status ?? 'connected',
    createdAt: now,
    updatedAt: now,
    lastCheckedAt: now,
  }
  return store.create(integration)
}

export async function updateIntegration(
  id: string,
  patch: Partial<
    Pick<Integration, 'name' | 'kind' | 'endpoint' | 'note' | 'iconUrl' | 'status'>
  >,
): Promise<Integration> {
  await jitter()
  const err = shouldInject('integrations', 'update')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`updateIntegration: id "${id}" not found`)
  return store.update(id, { ...patch, updatedAt: new Date().toISOString() })
}

export async function deleteIntegration(id: string): Promise<boolean> {
  await jitter()
  const err = shouldInject('integrations', 'delete')
  if (err) throw err
  return store.delete(id)
}

export async function testIntegration(id: string): Promise<Integration> {
  await jitter()
  const err = shouldInject('integrations', 'test')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`testIntegration: id "${id}" not found`)
  const now = new Date().toISOString()
  return store.update(id, {
    status: 'connected',
    lastCheckedAt: now,
    updatedAt: now,
    lastError: undefined,
  })
}

export async function disableIntegration(id: string): Promise<Integration> {
  await jitter()
  const err = shouldInject('integrations', 'disable')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`disableIntegration: id "${id}" not found`)
  const now = new Date().toISOString()
  return store.update(id, {
    status: 'disabled',
    updatedAt: now,
  })
}

export async function enableIntegration(id: string): Promise<Integration> {
  await jitter()
  const err = shouldInject('integrations', 'enable')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`enableIntegration: id "${id}" not found`)
  const now = new Date().toISOString()
  return store.update(id, {
    status: 'connected',
    lastCheckedAt: now,
    updatedAt: now,
    lastError: undefined,
  })
}
