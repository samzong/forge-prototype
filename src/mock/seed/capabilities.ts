import type { Capability, CapAction, CapRisk } from '@/types'

interface Row {
  id: string
  displayName: string
  category: string
  action: CapAction
  description: string
  integrationId: string
  risk: CapRisk
  deprecated?: boolean
}

function mk(row: Row): Capability {
  return { tenantId: 'acme', ...row }
}

export const capabilitiesSeed: Capability[] = [
  // ============ DCE ============
  mk({ id: 'dce:alerts:read', displayName: 'Read DCE alerts', category: 'dce', action: 'read', description: 'Read alert events from DCE observability.', integrationId: 'int-dce', risk: 'low' }),
  mk({ id: 'dce:alerts:watch', displayName: 'Watch DCE alerts', category: 'dce', action: 'watch', description: 'Subscribe to alert stream in real time.', integrationId: 'int-dce', risk: 'low' }),
  mk({ id: 'dce:pods:read', displayName: 'Read DCE pods', category: 'dce', action: 'read', description: 'Read pod status and metadata.', integrationId: 'int-dce', risk: 'low' }),
  mk({ id: 'dce:teams:read', displayName: 'Read DCE teams', category: 'dce', action: 'read', description: 'List teams and members.', integrationId: 'int-dce', risk: 'low' }),
  mk({ id: 'dce:namespaces:watch', displayName: 'Watch DCE namespaces', category: 'dce', action: 'watch', description: 'Subscribe to namespace change events.', integrationId: 'int-dce', risk: 'medium' }),
  mk({ id: 'dce:events:read', displayName: 'Read DCE events', category: 'dce', action: 'read', description: 'Read cluster events.', integrationId: 'int-dce', risk: 'low' }),
  mk({ id: 'dce:deploys:write', displayName: 'Trigger DCE deploys', category: 'dce', action: 'write', description: 'Trigger a deployment rollout.', integrationId: 'int-dce', risk: 'high' }),
  mk({ id: 'dce:secrets:read', displayName: 'Read DCE secrets', category: 'dce', action: 'read', description: 'Read secret keys (values redacted).', integrationId: 'int-dce', risk: 'high' }),
  mk({ id: 'dce:metrics:read', displayName: 'Read DCE metrics', category: 'dce', action: 'read', description: 'Query Prometheus-style metrics.', integrationId: 'int-dce', risk: 'low' }),

  // ============ CRM ============
  mk({ id: 'crm:sales:read', displayName: 'Read CRM sales', category: 'crm', action: 'read', description: 'Read sales opportunities and pipeline.', integrationId: 'int-crm', risk: 'medium' }),
  mk({ id: 'crm:customers:read', displayName: 'Read CRM customers', category: 'crm', action: 'read', description: 'Read customer profiles and contacts.', integrationId: 'int-crm', risk: 'medium' }),
  mk({ id: 'crm:customers:write', displayName: 'Update CRM customers', category: 'crm', action: 'write', description: 'Update customer profile fields.', integrationId: 'int-crm', risk: 'high' }),
  mk({ id: 'crm:deals:read', displayName: 'Read CRM deals', category: 'crm', action: 'read', description: 'Read deal history and stages.', integrationId: 'int-crm', risk: 'medium' }),
  mk({ id: 'crm:notes:write', displayName: 'Write CRM notes', category: 'crm', action: 'write', description: 'Append notes to CRM records.', integrationId: 'int-crm', risk: 'medium' }),
  mk({ id: 'crm:tasks:write', displayName: 'Create CRM tasks', category: 'crm', action: 'write', description: 'Create follow-up tasks.', integrationId: 'int-crm', risk: 'medium' }),
  mk({ id: 'crm:reports:read', displayName: 'Read CRM reports', category: 'crm', action: 'read', description: 'Query saved CRM reports.', integrationId: 'int-crm', risk: 'low' }),
  mk({ id: 'crm:inbox:send', displayName: 'Send to CRM inbox', category: 'crm', action: 'send', description: 'Push a summary to a CRM user inbox.', integrationId: 'int-crm', risk: 'medium' }),

  // ============ HR ============
  mk({ id: 'hr:employees:read', displayName: 'Read HR employees', category: 'hr', action: 'read', description: 'Read employee directory.', integrationId: 'int-hr', risk: 'medium' }),
  mk({ id: 'hr:leave:read', displayName: 'Read HR leave records', category: 'hr', action: 'read', description: 'Read leave history.', integrationId: 'int-hr', risk: 'medium' }),
  mk({ id: 'hr:leave:write', displayName: 'Submit HR leave', category: 'hr', action: 'write', description: 'Submit a new leave request.', integrationId: 'int-hr', risk: 'medium' }),
  mk({ id: 'hr:payroll:read', displayName: 'Read HR payroll', category: 'hr', action: 'read', description: 'Read aggregate payroll data.', integrationId: 'int-hr', risk: 'high' }),
  mk({ id: 'hr:org:read', displayName: 'Read HR org chart', category: 'hr', action: 'read', description: 'Traverse reporting lines.', integrationId: 'int-hr', risk: 'low' }),
  mk({ id: 'hr:attendance:read', displayName: 'Read HR attendance', category: 'hr', action: 'read', description: 'Read daily attendance logs.', integrationId: 'int-hr', risk: 'medium' }),

  // ============ Feishu ============
  mk({ id: 'feishu:messages:send', displayName: 'Send Feishu messages', category: 'feishu', action: 'send', description: 'Send text or card messages to chats.', integrationId: 'int-feishu', risk: 'medium' }),
  mk({ id: 'feishu:groups:read', displayName: 'Read Feishu groups', category: 'feishu', action: 'read', description: 'List groups accessible to the user.', integrationId: 'int-feishu', risk: 'low' }),
  mk({ id: 'feishu:users:read', displayName: 'Read Feishu users', category: 'feishu', action: 'read', description: 'Look up user profile by open_id.', integrationId: 'int-feishu', risk: 'low' }),
  mk({ id: 'feishu:cards:send', displayName: 'Send Feishu cards', category: 'feishu', action: 'send', description: 'Send interactive cards to chats.', integrationId: 'int-feishu', risk: 'medium' }),
  mk({ id: 'feishu:files:read', displayName: 'Read Feishu files', category: 'feishu', action: 'read', description: 'Read shared drive files.', integrationId: 'int-feishu', risk: 'medium' }),
  mk({ id: 'feishu:calendar:read', displayName: 'Read Feishu calendar', category: 'feishu', action: 'read', description: 'Read calendar events.', integrationId: 'int-feishu', risk: 'low' }),
  mk({ id: 'feishu:calendar:write', displayName: 'Write Feishu calendar', category: 'feishu', action: 'write', description: 'Create or update calendar events.', integrationId: 'int-feishu', risk: 'medium' }),
  mk({ id: 'feishu:approvals:send', displayName: 'Trigger Feishu approvals', category: 'feishu', action: 'send', description: 'Launch an approval flow.', integrationId: 'int-feishu', risk: 'medium' }),

  // ============ GitHub ============
  mk({ id: 'github:pulls:read', displayName: 'Read GitHub pull requests', category: 'github', action: 'read', description: 'Read PR metadata and diffs.', integrationId: 'int-github', risk: 'low' }),
  mk({ id: 'github:reviews:write', displayName: 'Post GitHub PR reviews', category: 'github', action: 'write', description: 'Submit review comments on a PR.', integrationId: 'int-github', risk: 'medium' }),
  mk({ id: 'github:issues:read', displayName: 'Read GitHub issues', category: 'github', action: 'read', description: 'Read issue content and labels.', integrationId: 'int-github', risk: 'low' }),
  mk({ id: 'github:issues:write', displayName: 'Write GitHub issues', category: 'github', action: 'write', description: 'Create, label, or close issues.', integrationId: 'int-github', risk: 'medium' }),
  mk({ id: 'github:commits:read', displayName: 'Read GitHub commits', category: 'github', action: 'read', description: 'Read commit history across repos.', integrationId: 'int-github', risk: 'low' }),
  mk({ id: 'github:releases:write', displayName: 'Create GitHub releases', category: 'github', action: 'write', description: 'Publish a new release with notes.', integrationId: 'int-github', risk: 'high' }),
  mk({ id: 'github:actions:read', displayName: 'Read GitHub Actions', category: 'github', action: 'read', description: 'Read workflow run status.', integrationId: 'int-github', risk: 'low' }),
  mk({ id: 'github:webhooks:read', displayName: 'Receive GitHub webhooks', category: 'github', action: 'watch', description: 'Subscribe to repository webhooks.', integrationId: 'int-github', risk: 'low' }),

  // ============ Legacy / deprecated (Token Factory migration) ============
  mk({ id: 'tf:customers:read', displayName: 'Read Token Factory customers (legacy)', category: 'dce', action: 'read', description: 'Legacy Token Factory customer feed; superseded by crm:customers:read.', integrationId: 'int-dce', risk: 'medium', deprecated: true }),
  mk({ id: 'tf:sla:read', displayName: 'Read Token Factory SLA (legacy)', category: 'dce', action: 'read', description: 'Legacy SLA feed.', integrationId: 'int-dce', risk: 'low', deprecated: true }),
  mk({ id: 'tf:billing:read', displayName: 'Read Token Factory billing (legacy)', category: 'dce', action: 'read', description: 'Legacy billing feed.', integrationId: 'int-dce', risk: 'medium', deprecated: true }),
  mk({ id: 'tf:audit:write', displayName: 'Write Token Factory audit (legacy)', category: 'dce', action: 'write', description: 'Legacy audit write sink.', integrationId: 'int-dce', risk: 'medium', deprecated: true }),

  // ============ Misc ============
  mk({ id: 'pagerduty:schedules:read', displayName: 'Read PagerDuty schedules', category: 'github', action: 'read', description: 'Read oncall rotation schedules.', integrationId: 'int-pagerduty', risk: 'low' }),
]
