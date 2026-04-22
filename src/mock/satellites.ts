import type { SatelliteDef } from '@/types'
import { createStore, type ListResult } from './store'
import { jitter } from './delay'
import { satellitesSeed } from './seed/satellites'

const store = createStore<SatelliteDef>(satellitesSeed)

export async function listSatellites(): Promise<ListResult<SatelliteDef>> {
  await jitter()
  return store.list()
}
