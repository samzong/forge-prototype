import type { App } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { appsSeed } from './seed/apps'

const store = createStore<App>(appsSeed)

export interface AppQuery {
  page?: number
  size?: number
  group?: App['group']
  status?: App['status']
  viewKind?: App['viewKind']
  ownerId?: string
  teamId?: string
  search?: string
  sort?: 'updatedAt-desc' | 'createdAt-desc' | 'stars-desc' | 'name-asc'
}

function buildListQuery(q: AppQuery = {}): ListQuery<App> {
  const needle = q.search?.trim().toLowerCase()
  return {
    page: q.page,
    size: q.size,
    filter: (app) => {
      if (q.group && app.group !== q.group) return false
      if (q.status && app.status !== q.status) return false
      if (q.viewKind && app.viewKind !== q.viewKind) return false
      if (q.ownerId && app.ownerId !== q.ownerId) return false
      if (q.teamId && app.teamId !== q.teamId) return false
      if (needle) {
        const hay = `${app.name} ${app.description}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    },
    sort: (a, b) => {
      switch (q.sort ?? 'updatedAt-desc') {
        case 'createdAt-desc':
          return b.createdAt.localeCompare(a.createdAt)
        case 'stars-desc':
          return (b.stars ?? 0) - (a.stars ?? 0)
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'updatedAt-desc':
        default:
          return b.updatedAt.localeCompare(a.updatedAt)
      }
    },
  }
}

export async function listApps(query: AppQuery = {}): Promise<ListResult<App>> {
  await jitter()
  const err = shouldInject('apps', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getApp(id: string): Promise<App | null> {
  await jitter()
  const err = shouldInject('apps', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export type CreateAppInput = Omit<App, 'createdAt' | 'updatedAt'> & {
  createdAt?: string
  updatedAt?: string
}

export async function createApp(input: CreateAppInput): Promise<App> {
  await jitter()
  const err = shouldInject('apps', 'create')
  if (err) throw err
  const now = new Date().toISOString()
  const app: App = {
    ...input,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  }
  return store.create(app)
}

export async function updateApp(id: string, patch: Partial<App>): Promise<App> {
  await jitter()
  const err = shouldInject('apps', 'update')
  if (err) throw err
  return store.update(id, { ...patch, updatedAt: new Date().toISOString() })
}

export async function deleteApp(id: string): Promise<boolean> {
  await jitter()
  const err = shouldInject('apps', 'delete')
  if (err) throw err
  return store.delete(id)
}
