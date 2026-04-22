import type { AppVersion } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { appVersionsSeed } from './seed/appVersions'
import { recordAuditEvent } from './auditEvents'

const store = createStore<AppVersion>(appVersionsSeed)

export interface AppVersionQuery {
  page?: number
  size?: number
  appId?: string
  isRollback?: boolean
  sort?: 'createdAt-desc' | 'createdAt-asc'
}

function buildListQuery(q: AppVersionQuery = {}): ListQuery<AppVersion> {
  return {
    page: q.page,
    size: q.size,
    filter: (v) => {
      if (q.appId && v.appId !== q.appId) return false
      if (typeof q.isRollback === 'boolean' && Boolean(v.isRollback) !== q.isRollback) return false
      return true
    },
    sort: (a, b) => {
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listAppVersions(
  query: AppVersionQuery = {},
): Promise<ListResult<AppVersion>> {
  await jitter()
  const err = shouldInject('appVersions', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getAppVersion(id: string): Promise<AppVersion | null> {
  await jitter()
  const err = shouldInject('appVersions', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export type CreateAppVersionInput = Omit<AppVersion, 'createdAt'> & {
  createdAt?: string
}

export async function createAppVersion(input: CreateAppVersionInput): Promise<AppVersion> {
  await jitter()
  const err = shouldInject('appVersions', 'create')
  if (err) throw err
  const version: AppVersion = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
  return store.create(version)
}

export async function rollbackToVersion(appId: string, versionId: string): Promise<AppVersion> {
  await jitter()
  const err = shouldInject('appVersions', 'rollback')
  if (err) throw err
  const target = store.get(versionId)
  if (!target) throw new Error(`rollbackToVersion: version "${versionId}" not found`)
  if (target.appId !== appId) {
    throw new Error(`rollbackToVersion: version "${versionId}" does not belong to app "${appId}"`)
  }
  const newId = `${versionId}-rb-${Date.now()}`
  const rollback: AppVersion = {
    ...target,
    id: newId,
    version: `${target.version}-rb`,
    createdAt: new Date().toISOString(),
    isRollback: true,
    rolledBackFromVersionId: versionId,
    changeNote: `Rollback to ${target.version}`,
  }
  const created = store.create(rollback)
  recordAuditEvent({
    tenantId: target.tenantId,
    appId,
    action: 'rollback',
    actorId: target.createdBy,
    targetVersionId: versionId,
    note: `Rolled back to ${target.version}; new version record ${newId}.`,
  })
  return created
}
