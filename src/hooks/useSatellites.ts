import type { SatelliteDef } from '@/types'
import type { ListResult } from '@/mock/store'
import { listSatellites } from '@/mock/satellites'
import { useAsync, type AsyncState } from './useAsync'

export function useSatellites(): AsyncState<ListResult<SatelliteDef>> {
  return useAsync(() => listSatellites(), [])
}
