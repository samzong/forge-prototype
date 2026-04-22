import type { Tenant } from '@/types'
import { createStore, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { tenantsSeed, CURRENT_TENANT_ID } from './seed/tenants'

const store = createStore<Tenant>(tenantsSeed)

export async function getCurrentTenant(): Promise<Tenant> {
  await jitter()
  const err = shouldInject('tenants', 'getCurrent')
  if (err) throw err
  const t = store.get(CURRENT_TENANT_ID)
  if (!t) throw new Error(`getCurrentTenant: seed tenant "${CURRENT_TENANT_ID}" missing`)
  return t
}

export async function getTenant(id: string): Promise<Tenant | null> {
  await jitter()
  const err = shouldInject('tenants', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export async function listTenants(): Promise<ListResult<Tenant>> {
  await jitter()
  const err = shouldInject('tenants', 'list')
  if (err) throw err
  return store.list()
}
