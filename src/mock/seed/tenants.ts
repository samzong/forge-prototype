import type { Tenant } from '@/types'
import { daysAgo } from './time'

export const tenantsSeed: Tenant[] = [
  {
    id: 'acme',
    name: 'Acme Corporation',
    hostSystemKind: 'dce',
    status: 'active',
    createdAt: daysAgo(400),
  },
]

export const CURRENT_TENANT_ID = 'acme'
