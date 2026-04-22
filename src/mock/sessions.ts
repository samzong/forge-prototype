import type { Session } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { sessionsSeed } from './seed/sessions'

const store = createStore<Session>(sessionsSeed)

export interface SessionQuery {
  page?: number
  size?: number
  status?: Session['status']
  createdBy?: string
  resultAppId?: string
  sort?: 'createdAt-desc' | 'createdAt-asc'
}

function buildListQuery(q: SessionQuery = {}): ListQuery<Session> {
  return {
    page: q.page,
    size: q.size,
    filter: (s) => {
      if (q.status && s.status !== q.status) return false
      if (q.createdBy && s.createdBy !== q.createdBy) return false
      if (q.resultAppId && s.resultAppId !== q.resultAppId) return false
      return true
    },
    sort: (a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listSessions(query: SessionQuery = {}): Promise<ListResult<Session>> {
  await jitter()
  return store.list(buildListQuery(query))
}

export async function getSession(id: string): Promise<Session | null> {
  await jitter()
  return store.get(id) ?? null
}
