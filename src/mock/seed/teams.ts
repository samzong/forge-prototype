import type { Team } from '@/types'
import { daysAgo } from './time'

export const teamsSeed: Team[] = [
  {
    id: 'team-platform',
    tenantId: 'acme',
    name: 'Platform',
    ownerId: 'u-samzong',
    createdAt: daysAgo(360),
  },
  {
    id: 'team-sre',
    tenantId: 'acme',
    name: 'SRE',
    ownerId: 'u-marcus',
    createdAt: daysAgo(200),
  },
  {
    id: 'team-security',
    tenantId: 'acme',
    name: 'Security',
    ownerId: 'u-samzong',
    createdAt: daysAgo(150),
  },
]
