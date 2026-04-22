import type { AuditEvent, AuditAction } from '@/types'
import { daysAgo, hoursAgo } from './time'

interface Row {
  id: string
  appId: string
  action: AuditAction
  actorId?: string
  createdAt: string
  targetVersionId?: string
  fromVersionId?: string
  note?: string
  metadata?: Record<string, unknown>
}

function mk(row: Row): AuditEvent {
  const { actorId = 'u-samzong', ...rest } = row
  return { tenantId: 'acme', actorId, ...rest }
}

export const auditEventsSeed: AuditEvent[] = [
  // ============ biz-cockpit ============
  mk({
    id: 'audit-001',
    appId: 'biz-cockpit',
    action: 'deploy',
    createdAt: daysAgo(9),
    targetVersionId: 'v0.1',
    note: 'Initial generation from cockpit prompt.',
  }),

  // ============ team-alert-dashboard ============
  mk({
    id: 'audit-002',
    appId: 'team-alert-dashboard',
    action: 'deploy',
    createdAt: daysAgo(170),
    targetVersionId: 'v1.0',
    note: 'Initial generation.',
  }),
  mk({
    id: 'audit-003',
    appId: 'team-alert-dashboard',
    action: 'deploy',
    createdAt: daysAgo(120),
    targetVersionId: 'v1.1',
    note: 'Added severity-weighted ordering.',
  }),
  mk({
    id: 'audit-004',
    appId: 'team-alert-dashboard',
    action: 'deploy',
    createdAt: daysAgo(60),
    targetVersionId: 'v1.2',
    note: 'Cache warm + Feishu card v2.',
  }),
  mk({
    id: 'audit-005',
    appId: 'team-alert-dashboard',
    action: 'rollback',
    createdAt: daysAgo(55),
    targetVersionId: 'v1.1',
    fromVersionId: 'v1.2',
    note: 'Feishu card v2 broke mobile render; reverted.',
  }),
  mk({
    id: 'audit-006',
    appId: 'team-alert-dashboard',
    action: 'deploy',
    createdAt: daysAgo(40),
    targetVersionId: 'v1.3',
    note: 'Fix mobile card padding.',
  }),
  mk({
    id: 'audit-007',
    appId: 'team-alert-dashboard',
    action: 'share',
    createdAt: daysAgo(35),
    actorId: 'u-samzong',
    note: 'Shared with team: infra-platform.',
    metadata: { targetTeamId: 'infra-platform' },
  }),
  mk({
    id: 'audit-008',
    appId: 'team-alert-dashboard',
    action: 'update',
    createdAt: daysAgo(20),
    note: 'Updated cron from Mon 9am to Mon 8:30am.',
  }),

  // ============ pr-review-bot ============
  mk({
    id: 'audit-009',
    appId: 'pr-review-bot',
    action: 'deploy',
    createdAt: daysAgo(215),
    targetVersionId: 'v1.0',
    note: 'Initial PR review assistant.',
  }),
  mk({
    id: 'audit-010',
    appId: 'pr-review-bot',
    action: 'deploy',
    createdAt: daysAgo(150),
    targetVersionId: 'v1.1',
    note: 'Support monorepo path filter.',
  }),
  mk({
    id: 'audit-011',
    appId: 'pr-review-bot',
    action: 'share',
    createdAt: daysAgo(145),
    note: 'Shared with team: platform.',
    metadata: { targetTeamId: 'platform' },
  }),
  mk({
    id: 'audit-012',
    appId: 'pr-review-bot',
    action: 'fork',
    createdAt: daysAgo(90),
    actorId: 'u-lena',
    note: 'Forked to add custom lint suggestions.',
    metadata: { forkedFromVersionId: 'v1.1' },
  }),

  // ============ hr-leave-request ============
  mk({
    id: 'audit-013',
    appId: 'hr-leave-request',
    action: 'deploy',
    createdAt: daysAgo(125),
    targetVersionId: 'v1.0',
    note: 'Initial leave form.',
  }),
  mk({
    id: 'audit-014',
    appId: 'hr-leave-request',
    action: 'update',
    createdAt: daysAgo(70),
    note: 'Added approval chain config.',
  }),

  // ============ customer-churn-early-warning ============
  mk({
    id: 'audit-015',
    appId: 'customer-churn-early-warning',
    action: 'deploy',
    createdAt: daysAgo(48),
    targetVersionId: 'v0.1',
  }),
  mk({
    id: 'audit-016',
    appId: 'customer-churn-early-warning',
    action: 'update',
    createdAt: daysAgo(30),
    note: 'Tweaked threshold from 40% to 35%.',
  }),

  // ============ migration-checklist-form ============
  mk({
    id: 'audit-017',
    appId: 'migration-checklist-form',
    action: 'deploy',
    createdAt: daysAgo(95),
    targetVersionId: 'v0.1',
  }),
  mk({
    id: 'audit-018',
    appId: 'migration-checklist-form',
    action: 'deploy',
    createdAt: daysAgo(65),
    targetVersionId: 'v0.2',
    note: 'Added rollback section.',
  }),
  mk({
    id: 'audit-019',
    appId: 'migration-checklist-form',
    action: 'deploy',
    createdAt: daysAgo(40),
    targetVersionId: 'v0.3',
    note: 'Require explicit window approval.',
  }),

  // ============ weekly-sales-report ============
  mk({
    id: 'audit-020',
    appId: 'weekly-sales-report',
    action: 'deploy',
    createdAt: daysAgo(80),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-021',
    appId: 'weekly-sales-report',
    action: 'share',
    createdAt: daysAgo(75),
    note: 'Shared with team: sales-leadership.',
    metadata: { targetTeamId: 'sales-leadership' },
  }),
  mk({
    id: 'audit-022',
    appId: 'weekly-sales-report',
    action: 'unshare',
    createdAt: daysAgo(12),
    note: 'Unshared after quarterly review wrap-up.',
    metadata: { targetTeamId: 'sales-leadership' },
  }),

  // ============ oncall-viewer ============
  mk({
    id: 'audit-023',
    appId: 'oncall-viewer',
    action: 'deploy',
    createdAt: daysAgo(45),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-024',
    appId: 'oncall-viewer',
    action: 'deploy',
    createdAt: daysAgo(22),
    targetVersionId: 'v1.1',
    note: 'Support escalation chain view.',
  }),

  // ============ incident-postmortem-drafter ============
  mk({
    id: 'audit-025',
    appId: 'incident-postmortem-drafter',
    action: 'deploy',
    createdAt: daysAgo(55),
    targetVersionId: 'v0.1',
  }),
  mk({
    id: 'audit-026',
    appId: 'incident-postmortem-drafter',
    action: 'deploy',
    createdAt: daysAgo(28),
    targetVersionId: 'v0.2',
    note: 'Pull timeline from metrics + slack.',
  }),
  mk({
    id: 'audit-027',
    appId: 'incident-postmortem-drafter',
    action: 'rollback',
    createdAt: daysAgo(18),
    targetVersionId: 'v0.1',
    fromVersionId: 'v0.2',
    note: 'Slack ingest rate-limited production.',
  }),

  // ============ slow-query-digest ============
  mk({
    id: 'audit-028',
    appId: 'slow-query-digest',
    action: 'deploy',
    createdAt: daysAgo(100),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-029',
    appId: 'slow-query-digest',
    action: 'deploy',
    createdAt: daysAgo(42),
    targetVersionId: 'v1.1',
    note: 'Per-db breakdown.',
  }),

  // ============ k8s-ns-watcher ============
  mk({
    id: 'audit-030',
    appId: 'k8s-ns-watcher',
    action: 'deploy',
    createdAt: daysAgo(110),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-031',
    appId: 'k8s-ns-watcher',
    action: 'update',
    createdAt: daysAgo(38),
    note: 'Include resource-quota warnings.',
  }),

  // ============ daily-standup-brief ============
  mk({
    id: 'audit-032',
    appId: 'daily-standup-brief',
    action: 'deploy',
    createdAt: daysAgo(140),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-033',
    appId: 'daily-standup-brief',
    action: 'share',
    createdAt: daysAgo(135),
    note: 'Shared with team: platform.',
    metadata: { targetTeamId: 'platform' },
  }),
  mk({
    id: 'audit-034',
    appId: 'daily-standup-brief',
    action: 'deploy',
    createdAt: daysAgo(50),
    targetVersionId: 'v1.1',
  }),

  // ============ design-review-rota ============
  mk({
    id: 'audit-035',
    appId: 'design-review-rota',
    action: 'deploy',
    createdAt: daysAgo(90),
    targetVersionId: 'v0.1',
  }),
  mk({
    id: 'audit-036',
    appId: 'design-review-rota',
    action: 'delete',
    createdAt: daysAgo(10),
    note: 'Team switched to Notion rotation doc; app deprecated.',
  }),

  // ============ kv-cost-optimizer ============
  mk({
    id: 'audit-037',
    appId: 'kv-cost-optimizer',
    action: 'deploy',
    createdAt: daysAgo(85),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-038',
    appId: 'kv-cost-optimizer',
    action: 'update',
    createdAt: daysAgo(25),
    note: 'Added regional cost multipliers.',
  }),

  // ============ security-finding-triage ============
  mk({
    id: 'audit-039',
    appId: 'security-finding-triage',
    action: 'deploy',
    createdAt: daysAgo(75),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-040',
    appId: 'security-finding-triage',
    action: 'share',
    createdAt: daysAgo(70),
    note: 'Shared with team: security.',
    metadata: { targetTeamId: 'security' },
  }),
  mk({
    id: 'audit-041',
    appId: 'security-finding-triage',
    action: 'deploy',
    createdAt: daysAgo(33),
    targetVersionId: 'v1.1',
    note: 'Auto-assign by component owner.',
  }),

  // ============ code-review-helper ============
  mk({
    id: 'audit-042',
    appId: 'code-review-helper',
    action: 'deploy',
    createdAt: daysAgo(68),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-043',
    appId: 'code-review-helper',
    action: 'fork',
    createdAt: daysAgo(15),
    actorId: 'u-lena',
    note: 'Forked for rust-specific lint integration.',
    metadata: { forkedFromVersionId: 'v1.0' },
  }),

  // ============ release-notes-gen ============
  mk({
    id: 'audit-044',
    appId: 'release-notes-gen',
    action: 'deploy',
    createdAt: daysAgo(58),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-045',
    appId: 'release-notes-gen',
    action: 'deploy',
    createdAt: daysAgo(21),
    targetVersionId: 'v1.1',
    note: 'Group by semantic scope.',
  }),

  // ============ bug-triage-bot ============
  mk({
    id: 'audit-046',
    appId: 'bug-triage-bot',
    action: 'deploy',
    createdAt: daysAgo(50),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-047',
    appId: 'bug-triage-bot',
    action: 'update',
    createdAt: daysAgo(8),
    note: 'Tightened severity heuristic.',
  }),

  // ============ terraform-drift-detector ============
  mk({
    id: 'audit-048',
    appId: 'terraform-drift-detector',
    action: 'deploy',
    createdAt: daysAgo(115),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-049',
    appId: 'terraform-drift-detector',
    action: 'rollback',
    createdAt: daysAgo(92),
    targetVersionId: 'v1.0',
    fromVersionId: 'v1.1',
    note: 'Detection window misconfigured; paging too aggressive.',
  }),

  // ============ capacity-planner ============
  mk({
    id: 'audit-050',
    appId: 'capacity-planner',
    action: 'deploy',
    createdAt: daysAgo(130),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-051',
    appId: 'capacity-planner',
    action: 'deploy',
    createdAt: daysAgo(72),
    targetVersionId: 'v1.1',
  }),
  mk({
    id: 'audit-052',
    appId: 'capacity-planner',
    action: 'share',
    createdAt: hoursAgo(30),
    note: 'Shared with team: sre.',
    metadata: { targetTeamId: 'sre' },
  }),

  // ============ jira-sync-bridge ============
  mk({
    id: 'audit-053',
    appId: 'jira-sync-bridge',
    action: 'deploy',
    createdAt: daysAgo(160),
    targetVersionId: 'v1.0',
  }),
  mk({
    id: 'audit-054',
    appId: 'jira-sync-bridge',
    action: 'update',
    createdAt: daysAgo(4),
    note: 'Map custom fields for release train.',
  }),

  // ============ recent activity (hours ago) ============
  mk({
    id: 'audit-055',
    appId: 'team-alert-dashboard',
    action: 'update',
    createdAt: hoursAgo(6),
    note: 'Updated oncall chat id after infra rename.',
  }),
]
