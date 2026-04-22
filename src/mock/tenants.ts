import type { Tenant } from '@/types'
import { createStore, type ListResult } from './store'
import { jitter } from './delay'
import { tenantsSeed, CURRENT_TENANT_ID } from './seed/tenants'

const store = createStore<Tenant>(tenantsSeed)

export async function getCurrentTenant(): Promise<Tenant> {
  await jitter()
  const t = store.get(CURRENT_TENANT_ID)
  if (!t) throw new Error(`getCurrentTenant: seed tenant "${CURRENT_TENANT_ID}" missing`)
  return t
}

export async function getTenant(id: string): Promise<Tenant | null> {
  await jitter()
  return store.get(id) ?? null
}

export async function listTenants(): Promise<ListResult<Tenant>> {
  await jitter()
  return store.list()
}
