import type { Tenant } from '@/types'
import { daysAgo, hoursFromNow } from './time'

export const tenantsSeed: Tenant[] = [
  {
    id: 'acme',
    name: 'Acme Corporation',
    hostSystemKind: 'dce',
    status: 'active',
    createdAt: daysAgo(400),
    maintenanceUntil: hoursFromNow(0.75),
  },
]

export const CURRENT_TENANT_ID = 'acme'
