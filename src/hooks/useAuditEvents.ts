import { useMemo } from 'react'
import type { AuditEvent } from '@/types'
import type { ListResult } from '@/mock/store'
import {
  getAuditEvent,
  listAuditEvents,
  type AuditEventQuery,
} from '@/mock/auditEvents'
import { useAsync, type AsyncState } from './useAsync'

export function useAuditEvents(
  query: AuditEventQuery = {},
): AsyncState<ListResult<AuditEvent>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listAuditEvents(query), [key])
}

export function useAuditEvent(
  id: string | undefined,
): AsyncState<AuditEvent | null> {
  return useAsync(async () => {
    if (!id) return null
    return getAuditEvent(id)
  }, [id])
}
