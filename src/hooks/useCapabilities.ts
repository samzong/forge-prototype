import { useMemo } from 'react'
import type { Capability } from '@/types'
import type { ListResult } from '@/mock/store'
import { listCapabilities, getCapability, type CapabilityQuery } from '@/mock/capabilities'
import { useAsync, type AsyncState } from './useAsync'

export function useCapabilities(query: CapabilityQuery = {}): AsyncState<ListResult<Capability>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listCapabilities(query), [key])
}

export function useCapability(id: string | undefined): AsyncState<Capability | null> {
  return useAsync(async () => {
    if (!id) return null
    return getCapability(id)
  }, [id])
}
