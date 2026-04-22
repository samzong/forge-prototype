import type { App, MarketplaceListing } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { appsSeed } from './seed/apps'
import { recordAuditEvent } from './auditEvents'
import {
  createMarketplaceListing,
  deleteMarketplaceListing,
  getMarketplaceListing,
  incrementForks,
  incrementSubscribers,
} from './marketplaceListings'
import { recordShare } from './shares'
import { CURRENT_USER_ID } from './seed/users'

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
  const updated = store.update(id, { ...patch, updatedAt: new Date().toISOString() })
  recordAuditEvent({
    tenantId: updated.tenantId,
    appId: updated.id,
    action: 'update',
    actorId: updated.ownerId,
    note: `Updated fields: ${Object.keys(patch).join(', ') || '(none)'}.`,
  })
  return updated
}

export async function deleteApp(id: string): Promise<boolean> {
  await jitter()
  const err = shouldInject('apps', 'delete')
  if (err) throw err
  const existing = store.get(id)
  const ok = store.delete(id)
  if (ok && existing) {
    recordAuditEvent({
      tenantId: existing.tenantId,
      appId: existing.id,
      action: 'delete',
      actorId: existing.ownerId,
      note: `App "${existing.name}" deleted.`,
    })
  }
  return ok
}

// ============================================================================
// Sprint 4 — Marketplace / Shared actions
// ============================================================================

function nanoId(): string {
  return Math.random().toString(36).slice(2, 8)
}

export interface ForkAppInput {
  sourceAppId: string
  actorId?: string
  newName?: string
}

export async function forkApp(input: ForkAppInput): Promise<App> {
  await jitter()
  const err = shouldInject('apps', 'fork')
  if (err) throw err
  const source = store.get(input.sourceAppId)
  if (!source) throw new Error(`forkApp: source "${input.sourceAppId}" not found`)
  const actor = input.actorId ?? CURRENT_USER_ID
  const now = new Date().toISOString()
  const forkId = `${source.id}-fork-${nanoId()}`
  const forked: App = {
    ...source,
    id: forkId,
    ownerId: actor,
    group: 'mine',
    name: input.newName ?? `${source.name} (Fork)`,
    status: 'draft',
    capabilities: [...source.capabilities],
    createdAt: now,
    updatedAt: now,
    lastRunAt: undefined,
    sharedWithUserIds: undefined,
    sharedWithTeamIds: undefined,
    relation: undefined,
    forkedFromAppId: source.id,
    forkedFromVersionId: source.currentVersion,
    stars: undefined,
    source: undefined,
    publishedAt: undefined,
  }
  const created = store.create(forked)
  incrementForks(source.id)
  recordShare({
    tenantId: source.tenantId,
    appId: source.id,
    sharedBy: source.ownerId,
    sharedWithKind: 'user',
    sharedWithId: actor,
    permission: 'edit',
    relation: 'forked',
    forkedAppId: created.id,
    forkedFromVersionId: source.currentVersion,
    note: `Forked from ${source.name}`,
  })
  recordAuditEvent({
    tenantId: created.tenantId,
    appId: created.id,
    action: 'fork',
    actorId: actor,
    note: `Forked from ${source.name} at ${source.currentVersion}.`,
    metadata: { sourceAppId: source.id, sourceVersion: source.currentVersion },
  })
  return created
}

export interface SubscribeAppInput {
  sourceAppId: string
  actorId?: string
}

export async function subscribeApp(input: SubscribeAppInput): Promise<App> {
  await jitter()
  const err = shouldInject('apps', 'subscribe')
  if (err) throw err
  const source = store.get(input.sourceAppId)
  if (!source) throw new Error(`subscribeApp: source "${input.sourceAppId}" not found`)
  const actor = input.actorId ?? CURRENT_USER_ID
  const now = new Date().toISOString()
  const subId = `${source.id}-sub-${nanoId()}`
  const subscribed: App = {
    ...source,
    id: subId,
    ownerId: source.ownerId,
    group: 'shared',
    relation: 'subscribed',
    createdAt: now,
    updatedAt: now,
    forkedFromAppId: source.id,
    forkedFromVersionId: source.currentVersion,
    stars: undefined,
    source: undefined,
    publishedAt: undefined,
    sharedWithUserIds: undefined,
    sharedWithTeamIds: undefined,
  }
  const created = store.create(subscribed)
  incrementSubscribers(source.id)
  recordShare({
    tenantId: source.tenantId,
    appId: source.id,
    sharedBy: source.ownerId,
    sharedWithKind: 'user',
    sharedWithId: actor,
    permission: 'use',
    relation: 'subscribed',
    note: `Subscribed to ${source.name}`,
  })
  recordAuditEvent({
    tenantId: created.tenantId,
    appId: created.id,
    action: 'subscribe',
    actorId: actor,
    note: `Subscribed to ${source.name}.`,
    metadata: { sourceAppId: source.id, sourceVersion: source.currentVersion },
  })
  return created
}

export async function unsubscribeApp(
  sharedAppId: string,
  actorId: string = CURRENT_USER_ID,
): Promise<boolean> {
  await jitter()
  const err = shouldInject('apps', 'unsubscribe')
  if (err) throw err
  const existing = store.get(sharedAppId)
  const ok = store.delete(sharedAppId)
  if (ok && existing) {
    recordAuditEvent({
      tenantId: existing.tenantId,
      appId: existing.id,
      action: 'unsubscribe',
      actorId,
      note: `Unsubscribed from ${existing.name}.`,
    })
  }
  return ok
}

export interface PublishAppInput {
  sourceAppId: string
  about: string
  highlights: string[]
  tags: string[]
  actorId?: string
}

export interface PublishAppOutput {
  listing: MarketplaceListing
}

export async function publishApp(input: PublishAppInput): Promise<PublishAppOutput> {
  const err = shouldInject('apps', 'publish')
  if (err) throw err
  const source = store.get(input.sourceAppId)
  if (!source) throw new Error(`publishApp: source "${input.sourceAppId}" not found`)
  const actor = input.actorId ?? CURRENT_USER_ID
  const existing = await getMarketplaceListing(input.sourceAppId)
  if (existing) throw new Error(`publishApp: "${input.sourceAppId}" is already published`)
  const now = new Date().toISOString()
  const listing = await createMarketplaceListing({
    id: source.id,
    tenantId: source.tenantId,
    appId: source.id,
    publisherId: actor,
    publishedAt: now,
    stars: 0,
    forks: 0,
    subscribers: 0,
    reviews: { count: 0, avg: 0 },
    about: input.about,
    highlights: [...input.highlights],
    tags: [...input.tags],
    versionLog: [{ version: source.currentVersion, date: now, note: 'Initial publication' }],
  })
  store.update(source.id, {
    source: input.tags.includes('official') ? 'dce-official' : 'community',
    publishedAt: now,
    stars: source.stars ?? 0,
    updatedAt: now,
  })
  recordAuditEvent({
    tenantId: source.tenantId,
    appId: source.id,
    action: 'publish',
    actorId: actor,
    note: `Published "${source.name}" to marketplace.`,
  })
  return { listing }
}

export async function unpublishApp(
  appId: string,
  actorId: string = CURRENT_USER_ID,
): Promise<boolean> {
  const err = shouldInject('apps', 'unpublish')
  if (err) throw err
  const source = store.get(appId)
  const ok = await deleteMarketplaceListing(appId)
  if (ok && source) {
    recordAuditEvent({
      tenantId: source.tenantId,
      appId: source.id,
      action: 'unpublish',
      actorId,
      note: `Unpublished "${source.name}" from marketplace.`,
    })
    store.update(appId, {
      source: undefined,
      publishedAt: undefined,
    })
  }
  return ok
}
