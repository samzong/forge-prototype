import type { User } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { usersSeed, CURRENT_USER_ID } from './seed/users'

const store = createStore<User>(usersSeed)

export interface UserQuery {
  page?: number
  size?: number
  teamId?: string
  role?: User['roles'][number]
}

function buildListQuery(q: UserQuery = {}): ListQuery<User> {
  return {
    page: q.page,
    size: q.size,
    filter: (u) => {
      if (q.teamId && !u.teamIds.includes(q.teamId)) return false
      if (q.role && !u.roles.includes(q.role)) return false
      return true
    },
    sort: (a, b) => a.displayName.localeCompare(b.displayName),
  }
}

export async function getCurrentUser(): Promise<User> {
  await jitter()
  const u = store.get(CURRENT_USER_ID)
  if (!u) throw new Error(`getCurrentUser: seed user "${CURRENT_USER_ID}" missing`)
  return u
}

export async function getUser(id: string): Promise<User | null> {
  await jitter()
  return store.get(id) ?? null
}

export async function listUsers(query: UserQuery = {}): Promise<ListResult<User>> {
  await jitter()
  return store.list(buildListQuery(query))
}
