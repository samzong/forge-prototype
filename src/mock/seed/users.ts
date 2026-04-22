import type { User } from '@/types'
import { daysAgo } from './time'

export const usersSeed: User[] = [
  {
    id: 'u-samzong',
    tenantId: 'acme',
    username: 'samzong',
    displayName: 'Samzong Lu',
    email: 'samzong@acme.com',
    primaryTeamId: 'team-platform',
    teamIds: ['team-platform'],
    roles: ['admin'],
    createdAt: daysAgo(300),
  },
  {
    id: 'u-leah',
    tenantId: 'acme',
    username: 'leah',
    displayName: 'Leah Chen',
    email: 'leah@acme.com',
    primaryTeamId: 'team-platform',
    teamIds: ['team-platform'],
    roles: ['user'],
    createdAt: daysAgo(220),
  },
  {
    id: 'u-marcus',
    tenantId: 'acme',
    username: 'marcus',
    displayName: 'Marcus Vega',
    email: 'marcus@acme.com',
    primaryTeamId: 'team-sre',
    teamIds: ['team-sre'],
    roles: ['team-manager'],
    createdAt: daysAgo(180),
  },
]

export const CURRENT_USER_ID = 'u-samzong'
