import type { Execution } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { executionsSeed } from './seed/executions'

const store = createStore<Execution>(executionsSeed)

export interface ExecutionQuery {
  page?: number
  size?: number
  appId?: string
  status?: Execution['status']
  trigger?: Execution['trigger']
  versionId?: string
  sort?: 'startedAt-desc' | 'startedAt-asc'
}

function buildListQuery(q: ExecutionQuery = {}): ListQuery<Execution> {
  return {
    page: q.page,
    size: q.size,
    filter: (e) => {
      if (q.appId && e.appId !== q.appId) return false
      if (q.status && e.status !== q.status) return false
      if (q.trigger && e.trigger !== q.trigger) return false
      if (q.versionId && e.versionId !== q.versionId) return false
      return true
    },
    sort: (a, b) => {
      const cmp = a.startedAt.localeCompare(b.startedAt)
      return q.sort === 'startedAt-asc' ? cmp : -cmp
    },
  }
}

export async function listExecutions(
  query: ExecutionQuery = {},
): Promise<ListResult<Execution>> {
  await jitter()
  const err = shouldInject('executions', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getExecution(id: string): Promise<Execution | null> {
  await jitter()
  const err = shouldInject('executions', 'get')
  if (err) throw err
  return store.get(id) ?? null
}
