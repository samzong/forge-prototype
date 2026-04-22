import type { ExecutionLog } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { executionLogsSeed } from './seed/executionLogs'

const store = createStore<ExecutionLog>(executionLogsSeed)

export interface ExecutionLogQuery {
  page?: number
  size?: number
  executionId?: string
  level?: ExecutionLog['level']
  tag?: ExecutionLog['tag']
  tail?: boolean
}

function buildListQuery(q: ExecutionLogQuery = {}): ListQuery<ExecutionLog> {
  return {
    page: q.page,
    size: q.size,
    filter: (l) => {
      if (q.executionId && l.executionId !== q.executionId) return false
      if (q.level && l.level !== q.level) return false
      if (q.tag && l.tag !== q.tag) return false
      return true
    },
    sort: (a, b) => a.timestamp.localeCompare(b.timestamp),
  }
}

export async function listExecutionLogs(
  query: ExecutionLogQuery = {},
): Promise<ListResult<ExecutionLog>> {
  await jitter()
  const err = shouldInject('executionLogs', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}
