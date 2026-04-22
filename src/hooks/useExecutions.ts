import { useMemo } from 'react'
import type { Execution } from '@/types'
import type { ListResult } from '@/mock/store'
import { listExecutions, getExecution, type ExecutionQuery } from '@/mock/executions'
import { useAsync, type AsyncState } from './useAsync'

export function useExecutions(query: ExecutionQuery = {}): AsyncState<ListResult<Execution>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listExecutions(query), [key])
}

export function useExecution(id: string | undefined): AsyncState<Execution | null> {
  return useAsync(async () => {
    if (!id) return null
    return getExecution(id)
  }, [id])
}
