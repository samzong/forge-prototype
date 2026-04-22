import type { DeliveryChannel } from '@/types'
import { daysAgo } from './time'

function mk(input: Omit<DeliveryChannel, 'tenantId' | 'userId'>): DeliveryChannel {
  return { tenantId: 'acme', userId: 'u-samzong', ...input }
}

export const deliveryChannelsSeed: DeliveryChannel[] = [
  mk({
    id: 'dc-feishu-platform',
    kind: 'feishu',
    label: 'Platform team Feishu',
    config: { kind: 'feishu', chatId: 'oc_7ab92c1f0e4d' },
    events: ['deploy', 'execution-failed', 'policy'],
    enabled: true,
    verifiedAt: daysAgo(60),
    createdAt: daysAgo(62),
  }),
  mk({
    id: 'dc-feishu-personal',
    kind: 'feishu',
    label: 'Samzong personal DM',
    config: { kind: 'feishu', chatId: 'oc_personal_samzong_ff01' },
    events: ['share', 'fork'],
    enabled: true,
    verifiedAt: daysAgo(30),
    createdAt: daysAgo(30),
  }),
  mk({
    id: 'dc-webhook-pagerduty',
    kind: 'webhook',
    label: 'PagerDuty bridge',
    config: {
      kind: 'webhook',
      url: 'https://events.pagerduty.com/v2/enqueue',
      signingSecret: 'whsec_••••••••••',
    },
    events: ['execution-failed', 'policy'],
    enabled: true,
    verifiedAt: daysAgo(14),
    createdAt: daysAgo(14),
  }),
  mk({
    id: 'dc-webhook-staging',
    kind: 'webhook',
    label: 'Staging relay (not verified)',
    config: {
      kind: 'webhook',
      url: 'https://hooks.staging.acme.internal/forge-events',
    },
    events: ['deploy'],
    enabled: false,
    createdAt: daysAgo(2),
  }),
]
