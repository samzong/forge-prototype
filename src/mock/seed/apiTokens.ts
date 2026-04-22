import type { ApiToken } from '@/types'
import { daysAgo, hoursAgo } from './time'

function mk(input: Omit<ApiToken, 'tenantId'>): ApiToken {
  return { tenantId: 'acme', ...input }
}

export const apiTokensSeed: ApiToken[] = [
  mk({
    id: 'tok-laptop-cli',
    ownerId: 'u-samzong',
    label: 'CLI on laptop',
    prefix: 'tfg_live_ab12',
    createdAt: daysAgo(95),
    lastUsedAt: hoursAgo(3),
    scopes: ['apps:read', 'apps:write', 'sessions:read', 'sessions:write'],
  }),
  mk({
    id: 'tok-ci-github',
    ownerId: 'u-samzong',
    label: 'GitHub Actions — deploy pipeline',
    prefix: 'tfg_live_9fe3',
    createdAt: daysAgo(42),
    lastUsedAt: hoursAgo(18),
    expiresAt: daysAgo(-90),
    scopes: ['apps:read', 'executions:read', 'executions:write'],
  }),
  mk({
    id: 'tok-legacy-terraform',
    ownerId: 'u-samzong',
    label: 'Terraform infra bot (legacy)',
    prefix: 'tfg_live_7c4d',
    createdAt: daysAgo(280),
    revokedAt: daysAgo(12),
    scopes: ['apps:read', 'capabilities:read'],
  }),
  mk({
    id: 'tok-expired-readonly',
    ownerId: 'u-samzong',
    label: 'Read-only dashboard probe',
    prefix: 'tfg_live_41a2',
    createdAt: daysAgo(220),
    expiresAt: daysAgo(5),
    scopes: ['apps:read'],
  }),
  mk({
    id: 'tok-fresh-unused',
    ownerId: 'u-samzong',
    label: 'Fresh token — not yet used',
    prefix: 'tfg_live_ff01',
    createdAt: daysAgo(1),
    scopes: ['apps:read', 'notifications:read'],
  }),
]
