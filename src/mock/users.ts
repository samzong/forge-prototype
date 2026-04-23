import type { User } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { usersSeed, CURRENT_USER_ID } from './seed/users'

const store = createStore<User>(usersSeed)

const ACTIVE_USER_STORAGE_KEY = 'forge.activeUserId'
export const ACTIVE_USER_CHANGED_EVENT = 'forge:activeUserChanged'

function readInitialActiveUserId(): string {
  if (typeof window === 'undefined') return CURRENT_USER_ID
  try {
    const stored = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY)
    if (stored && store.get(stored)) return stored
  } catch {
    // localStorage unavailable
  }
  return CURRENT_USER_ID
}

let activeUserId = readInitialActiveUserId()

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
  const err = shouldInject('users', 'getCurrent')
  if (err) throw err
  const u = store.get(activeUserId)
  if (!u) throw new Error(`getCurrentUser: active user "${activeUserId}" missing`)
  return u
}

export function getActiveUserId(): string {
  return activeUserId
}

export function setActiveUserId(id: string): void {
  if (!store.get(id)) throw new Error(`setActiveUserId: user "${id}" not found`)
  if (id === activeUserId) return
  activeUserId = id
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, id)
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(ACTIVE_USER_CHANGED_EVENT))
  }
}

export async function getUser(id: string): Promise<User | null> {
  await jitter()
  const err = shouldInject('users', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export async function listUsers(query: UserQuery = {}): Promise<ListResult<User>> {
  await jitter()
  const err = shouldInject('users', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<User, 'teamIds' | 'primaryTeamId' | 'roles' | 'displayName'>>,
): Promise<User> {
  await jitter()
  const err = shouldInject('users', 'update')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`updateUser: id "${id}" not found`)
  return store.update(id, patch)
}
