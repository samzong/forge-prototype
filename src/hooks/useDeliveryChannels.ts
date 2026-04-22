import { useMemo } from 'react'
import type { DeliveryChannel } from '@/types'
import type { ListResult } from '@/mock/store'
import {
  listDeliveryChannels,
  getDeliveryChannel,
  type DeliveryChannelQuery,
} from '@/mock/deliveryChannels'
import { useAsync, type AsyncState } from './useAsync'

export function useDeliveryChannels(
  query: DeliveryChannelQuery = {},
): AsyncState<ListResult<DeliveryChannel>> {
  const key = useMemo(() => JSON.stringify(query), [query])
  return useAsync(() => listDeliveryChannels(query), [key])
}

export function useDeliveryChannel(
  id: string | undefined,
): AsyncState<DeliveryChannel | null> {
  return useAsync(async () => {
    if (!id) return null
    return getDeliveryChannel(id)
  }, [id])
}
