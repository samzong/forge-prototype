import type { SatelliteDef } from '@/types'
import { createStore, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { satellitesSeed } from './seed/satellites'

const store = createStore<SatelliteDef>(satellitesSeed)

export async function listSatellites(): Promise<ListResult<SatelliteDef>> {
  await jitter()
  const err = shouldInject('satellites', 'list')
  if (err) throw err
  return store.list()
}
