import type { Tenant } from '@/types'
import { getCurrentTenant } from '@/mock/tenants'
import { useAsync, type AsyncState } from './useAsync'

export function useCurrentTenant(): AsyncState<Tenant> {
  return useAsync(() => getCurrentTenant(), [])
}
