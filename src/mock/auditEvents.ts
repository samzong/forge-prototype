import type { AuditEvent } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { auditEventsSeed } from './seed/auditEvents'

const store = createStore<AuditEvent>(auditEventsSeed)

export interface AuditEventQuery {
  page?: number
  size?: number
  appId?: string
  teamId?: string
  action?: AuditEvent['action']
  actorId?: string
  sort?: 'createdAt-desc' | 'createdAt-asc'
}

function buildListQuery(q: AuditEventQuery = {}): ListQuery<AuditEvent> {
  return {
    page: q.page,
    size: q.size,
    filter: (e) => {
      if (q.appId && e.appId !== q.appId) return false
      if (q.teamId && e.teamId !== q.teamId) return false
      if (q.action && e.action !== q.action) return false
      if (q.actorId && e.actorId !== q.actorId) return false
      return true
    },
    sort: (a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listAuditEvents(
  query: AuditEventQuery = {},
): Promise<ListResult<AuditEvent>> {
  await jitter()
  const err = shouldInject('auditEvents', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getAuditEvent(id: string): Promise<AuditEvent | null> {
  await jitter()
  const err = shouldInject('auditEvents', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export type CreateAuditEventInput = Omit<AuditEvent, 'createdAt'> & {
  createdAt?: string
}

export async function createAuditEvent(
  input: CreateAuditEventInput,
): Promise<AuditEvent> {
  await jitter()
  const err = shouldInject('auditEvents', 'create')
  if (err) throw err
  const event: AuditEvent = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
  return store.create(event)
}

export function recordAuditEvent(
  input: Omit<AuditEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): AuditEvent {
  const nowIso = new Date().toISOString()
  const id = input.id ?? `audit-${Math.random().toString(36).slice(2, 10)}`
  const event: AuditEvent = {
    ...input,
    id,
    createdAt: input.createdAt ?? nowIso,
  }
  return store.create(event)
}
