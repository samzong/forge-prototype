import type { Policy, PolicyKind, PolicyAction } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { policiesSeed } from './seed/policies'

const store = createStore<Policy>(policiesSeed)

export interface PolicyQuery {
  page?: number
  size?: number
  tenantId?: string
  kind?: PolicyKind
  action?: PolicyAction
  search?: string
  sort?: 'createdAt-desc' | 'createdAt-asc' | 'updatedAt-desc'
}

function buildListQuery(q: PolicyQuery = {}): ListQuery<Policy> {
  const needle = q.search?.trim().toLowerCase()
  return {
    page: q.page,
    size: q.size,
    filter: (p) => {
      if (q.tenantId && p.tenantId !== q.tenantId) return false
      if (q.kind && p.kind !== q.kind) return false
      if (q.action && p.action !== q.action) return false
      if (needle) {
        const hay = `${p.label} ${p.rule}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    },
    sort: (a, b) => {
      if (q.sort === 'updatedAt-desc') return b.updatedAt.localeCompare(a.updatedAt)
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listPolicies(
  query: PolicyQuery = {},
): Promise<ListResult<Policy>> {
  await jitter()
  const err = shouldInject('policies', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getPolicy(id: string): Promise<Policy | null> {
  await jitter()
  const err = shouldInject('policies', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export type CreatePolicyInput = Omit<Policy, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

export async function createPolicy(input: CreatePolicyInput): Promise<Policy> {
  await jitter()
  const err = shouldInject('policies', 'create')
  if (err) throw err
  const now = new Date().toISOString()
  const id = input.id ?? `pol-${Math.random().toString(36).slice(2, 8)}`
  const policy: Policy = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  }
  return store.create(policy)
}

export async function updatePolicy(
  id: string,
  patch: Partial<Pick<Policy, 'kind' | 'label' | 'rule' | 'action'>>,
): Promise<Policy> {
  await jitter()
  const err = shouldInject('policies', 'update')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`updatePolicy: id "${id}" not found`)
  return store.update(id, { ...patch, updatedAt: new Date().toISOString() })
}

export async function deletePolicy(id: string): Promise<boolean> {
  await jitter()
  const err = shouldInject('policies', 'delete')
  if (err) throw err
  return store.delete(id)
}
