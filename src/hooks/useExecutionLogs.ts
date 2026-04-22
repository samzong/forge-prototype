import { useMemo } from 'react'
import type { ExecutionLog } from '@/types'
import type { ListResult } from '@/mock/store'
import { listExecutionLogs, type ExecutionLogQuery } from '@/mock/executionLogs'
import { useAsync, type AsyncState } from './useAsync'

export function useExecutionLogs(
  query: ExecutionLogQuery = {},
): AsyncState<ListResult<ExecutionLog>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listExecutionLogs(query), [key])
}
