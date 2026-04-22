import type { ApiToken } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { apiTokensSeed } from './seed/apiTokens'

const store = createStore<ApiToken>(apiTokensSeed)

export type ApiTokenStatus = 'active' | 'revoked' | 'expired'

export interface ApiTokenQuery {
  page?: number
  size?: number
  ownerId?: string
  status?: ApiTokenStatus
  sort?: 'createdAt-desc' | 'createdAt-asc' | 'lastUsed-desc'
}

export function tokenStatus(t: ApiToken, now = new Date()): ApiTokenStatus {
  if (t.revokedAt) return 'revoked'
  if (t.expiresAt && Date.parse(t.expiresAt) < now.getTime()) return 'expired'
  return 'active'
}

function buildListQuery(q: ApiTokenQuery = {}): ListQuery<ApiToken> {
  return {
    page: q.page,
    size: q.size,
    filter: (t) => {
      if (q.ownerId && t.ownerId !== q.ownerId) return false
      if (q.status && tokenStatus(t) !== q.status) return false
      return true
    },
    sort: (a, b) => {
      switch (q.sort ?? 'createdAt-desc') {
        case 'createdAt-asc':
          return a.createdAt.localeCompare(b.createdAt)
        case 'lastUsed-desc': {
          const la = a.lastUsedAt ?? ''
          const lb = b.lastUsedAt ?? ''
          return lb.localeCompare(la)
        }
        case 'createdAt-desc':
        default:
          return b.createdAt.localeCompare(a.createdAt)
      }
    },
  }
}

export async function listApiTokens(
  query: ApiTokenQuery = {},
): Promise<ListResult<ApiToken>> {
  await jitter()
  const err = shouldInject('apiTokens', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getApiToken(id: string): Promise<ApiToken | null> {
  await jitter()
  const err = shouldInject('apiTokens', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export interface CreateApiTokenInput {
  ownerId: string
  label: string
  scopes: string[]
  expiresAt?: string
}

export interface CreateApiTokenResult {
  token: ApiToken
  plaintext: string
}

function randomHex(bytes: number): string {
  let out = ''
  for (let i = 0; i < bytes; i++) {
    out += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  }
  return out
}

export async function createApiToken(
  input: CreateApiTokenInput,
): Promise<CreateApiTokenResult> {
  await jitter()
  const err = shouldInject('apiTokens', 'create')
  if (err) throw err
  const id = `tok-${randomHex(5)}`
  const prefix = `tfg_live_${randomHex(2)}`
  const plaintext = `${prefix}_${randomHex(16)}`
  const token: ApiToken = {
    id,
    tenantId: 'acme',
    ownerId: input.ownerId,
    label: input.label,
    prefix,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
    scopes: input.scopes,
  }
  store.create(token)
  return { token, plaintext }
}

export async function revokeApiToken(id: string): Promise<ApiToken> {
  await jitter()
  const err = shouldInject('apiTokens', 'revoke')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`revokeApiToken: id "${id}" not found`)
  if (existing.revokedAt) return existing
  return store.update(id, { revokedAt: new Date().toISOString() })
}
