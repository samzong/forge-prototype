import type { Capability } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { capabilitiesSeed } from './seed/capabilities'

const store = createStore<Capability>(capabilitiesSeed)

export interface CapabilityQuery {
  page?: number
  size?: number
  category?: string
  action?: Capability['action']
  risk?: Capability['risk']
  integrationId?: string
  search?: string
  includeDeprecated?: boolean
}

function buildListQuery(q: CapabilityQuery = {}): ListQuery<Capability> {
  const needle = q.search?.trim().toLowerCase()
  return {
    page: q.page,
    size: q.size,
    filter: (c) => {
      if (!q.includeDeprecated && c.deprecated) return false
      if (q.category && c.category !== q.category) return false
      if (q.action && c.action !== q.action) return false
      if (q.risk && c.risk !== q.risk) return false
      if (q.integrationId && c.integrationId !== q.integrationId) return false
      if (needle) {
        const hay = `${c.displayName} ${c.id} ${c.description}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    },
    sort: (a, b) => a.id.localeCompare(b.id),
  }
}

export async function listCapabilities(
  query: CapabilityQuery = {},
): Promise<ListResult<Capability>> {
  await jitter()
  return store.list(buildListQuery(query))
}

export async function getCapability(id: string): Promise<Capability | null> {
  await jitter()
  return store.get(id) ?? null
}
