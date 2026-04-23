import { useMemo } from 'react'
import type { SpecDraft } from '@/types'
import type { ListResult } from '@/mock/store'
import { listDrafts, getDraft, type DraftQuery } from '@/mock/drafts'
import { useAsync, type AsyncState } from './useAsync'

export function useDrafts(query: DraftQuery = {}): AsyncState<ListResult<SpecDraft>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listDrafts(query), [key])
}

export function useDraft(id: string | undefined): AsyncState<SpecDraft | null> {
  return useAsync(async () => {
    if (!id) return null
    return getDraft(id)
  }, [id])
}
