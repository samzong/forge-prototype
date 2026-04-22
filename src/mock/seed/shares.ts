import type { Share } from '@/types'
import { daysAgo } from './time'

interface MkShareInput {
  id: string
  appId: string
  sharedBy: string
  sharedWithKind: 'user' | 'team'
  sharedWithId: string
  permission: 'view' | 'use' | 'edit'
  relation: 'subscribed' | 'forked' | 'direct'
  createdAt: string
  forkedAppId?: string
  forkedFromVersionId?: string
  note?: string
}

function mkShare(input: MkShareInput): Share {
  return {
    tenantId: 'acme',
    ...input,
  }
}

export const sharesSeed: Share[] = [
  mkShare({
    id: 'share-hr-leave-sub',
    appId: 'hr-leave-request',
    sharedBy: 'u-marcus',
    sharedWithKind: 'user',
    sharedWithId: 'u-samzong',
    permission: 'use',
    relation: 'subscribed',
    createdAt: daysAgo(260),
    note: 'Subscribed to HR Leave Request',
  }),
  mkShare({
    id: 'share-design-review-sub',
    appId: 'design-review-rota',
    sharedBy: 'u-leah',
    sharedWithKind: 'user',
    sharedWithId: 'u-samzong',
    permission: 'view',
    relation: 'subscribed',
    createdAt: daysAgo(130),
    note: 'Subscribed to Design Review Rota',
  }),
  mkShare({
    id: 'share-security-triage-sub',
    appId: 'security-finding-triage',
    sharedBy: 'u-leah',
    sharedWithKind: 'user',
    sharedWithId: 'u-samzong',
    permission: 'use',
    relation: 'subscribed',
    createdAt: daysAgo(220),
    note: 'Subscribed to Security Finding Triage',
  }),
  mkShare({
    id: 'share-oncall-viewer-fork',
    appId: 'oncall-viewer-upstream',
    sharedBy: 'u-marcus',
    sharedWithKind: 'user',
    sharedWithId: 'u-samzong',
    permission: 'edit',
    relation: 'forked',
    forkedAppId: 'oncall-viewer',
    forkedFromVersionId: 'v1.1',
    createdAt: daysAgo(195),
    note: 'Forked from Oncall Rotation Viewer',
  }),
  mkShare({
    id: 'share-kv-cost-fork',
    appId: 'kv-cost-optimizer-upstream',
    sharedBy: 'u-marcus',
    sharedWithKind: 'user',
    sharedWithId: 'u-samzong',
    permission: 'edit',
    relation: 'forked',
    forkedAppId: 'kv-cost-optimizer',
    forkedFromVersionId: 'v1.2',
    createdAt: daysAgo(150),
    note: 'Forked from KV Cost Optimizer',
  }),
  mkShare({
    id: 'share-alert-dashboard-team',
    appId: 'team-alert-dashboard',
    sharedBy: 'u-samzong',
    sharedWithKind: 'team',
    sharedWithId: 'team-platform',
    permission: 'view',
    relation: 'direct',
    createdAt: daysAgo(40),
    note: 'Shared with platform team',
  }),
  mkShare({
    id: 'share-pr-review-bot-user',
    appId: 'pr-review-bot',
    sharedBy: 'u-samzong',
    sharedWithKind: 'user',
    sharedWithId: 'u-leah',
    permission: 'use',
    relation: 'direct',
    createdAt: daysAgo(18),
    note: 'Shared with Leah for review feedback',
  }),
  mkShare({
    id: 'share-daily-standup-team',
    appId: 'daily-standup-brief',
    sharedBy: 'u-samzong',
    sharedWithKind: 'team',
    sharedWithId: 'team-platform',
    permission: 'use',
    relation: 'direct',
    createdAt: daysAgo(55),
    note: 'Shared with platform team',
  }),
]
