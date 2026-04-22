import type { Execution, ExecutionStatus, ExecutionTrigger } from '@/types'

interface AppSpec {
  appId: string
  idPrefix: string
  versionId: string
  baseTrigger: ExecutionTrigger
  outputSummaryByStatus: Partial<Record<ExecutionStatus, string>>
}

const primary: AppSpec[] = [
  {
    appId: 'team-alert-dashboard',
    idPrefix: 'exec-tad',
    versionId: 'ver-tad-1-3',
    baseTrigger: 'schedule',
    outputSummaryByStatus: {
      succeeded: 'Pushed 12 alerts · routed 3 P1 to #platform-oncall',
      failed: 'Feishu webhook 502 on push — retry budget exhausted',
      timeout: 'Alert aggregation exceeded 45s sandbox limit',
      running: 'Aggregating alerts from 8 pods…',
      cancelled: 'Cancelled by operator during deploy freeze',
    },
  },
  {
    appId: 'pr-review-bot',
    idPrefix: 'exec-prb',
    versionId: 'ver-prb-2-1',
    baseTrigger: 'webhook',
    outputSummaryByStatus: {
      succeeded: 'Summarized 312 lines · suggested 2 labels · routed to reviewer',
      failed: 'Model call rejected — context exceeded 32k tokens',
      timeout: 'Monorepo diff took > 60s to fetch',
      running: 'Running model summary on diff…',
      cancelled: 'Author force-pushed before run completed',
    },
  },
  {
    appId: 'customer-churn-early-warning',
    idPrefix: 'exec-ccew',
    versionId: 'ver-ccew-1-0',
    baseTrigger: 'schedule',
    outputSummaryByStatus: {
      succeeded: 'Scored 4,812 accounts · 21 crossed churn threshold · delivered',
      failed: 'CRM signals API returned 500 for region=eu-west-1',
      timeout: 'Scoring pass exceeded 120s on v1.0 model',
      running: 'Scoring churn risk across 4,800 accounts…',
      cancelled: 'Superseded by newer schedule trigger',
    },
  },
]

const secondaryIds: Array<{ appId: string; versionId: string }> = [
  { appId: 'daily-standup-brief', versionId: 'ver-dsb-2-0' },
  { appId: 'biz-cockpit', versionId: 'ver-bc-0-1' },
  { appId: 'slow-query-digest', versionId: 'ver-sqd-0-3' },
]

function mk(
  id: string,
  spec: AppSpec,
  status: ExecutionStatus,
  trigger: ExecutionTrigger,
  hoursAgo: number,
  durationMs: number | undefined,
  triggeredBy: string = 'system',
  errorMessage?: string,
): Execution {
  const started = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
  const finished =
    status === 'running'
      ? undefined
      : new Date(Date.now() - hoursAgo * 60 * 60 * 1000 + (durationMs ?? 0)).toISOString()
  const exitCode =
    status === 'succeeded'
      ? 0
      : status === 'running'
        ? undefined
        : status === 'cancelled'
          ? 130
          : 1
  return {
    id,
    tenantId: 'acme',
    appId: spec.appId,
    versionId: spec.versionId,
    status,
    trigger,
    triggeredBy,
    startedAt: started,
    finishedAt: finished,
    durationMs: status === 'running' ? undefined : durationMs,
    exitCode,
    outputSummary: spec.outputSummaryByStatus[status],
    errorMessage,
  }
}

function generatePrimary(spec: AppSpec): Execution[] {
  const rows: Execution[] = []
  for (let i = 0; i < 30; i++) {
    const hours = i * 48 + 1 + (i % 3)
    const durationMs = 3200 + ((i * 713) % 4800)
    rows.push(mk(`${spec.idPrefix}-${30 - i}`, spec, 'succeeded', spec.baseTrigger, hours, durationMs))
  }
  return rows
}

const teamAlert = primary[0]
const prReview = primary[1]
const churn = primary[2]

const coverage: Execution[] = [
  mk(
    'exec-tad-f-1',
    teamAlert,
    'failed',
    'schedule',
    14,
    7200,
    'system',
    'feishu.push: 502 Bad Gateway after 3 retries',
  ),
  mk(
    'exec-prb-f-1',
    prReview,
    'failed',
    'webhook',
    7,
    11400,
    'system',
    'model.invoke: context_length_exceeded (34213 tokens)',
  ),
  mk(
    'exec-ccew-f-1',
    churn,
    'failed',
    'schedule',
    52,
    44300,
    'system',
    'crm.signals: upstream 500 Internal Server Error',
  ),
  mk(
    'exec-prb-t-1',
    prReview,
    'timeout',
    'webhook',
    18,
    60_000,
    'system',
    'sandbox.timeout: execution exceeded 60000ms',
  ),
  mk(
    'exec-ccew-t-1',
    churn,
    'timeout',
    'schedule',
    96,
    120_000,
    'system',
    'sandbox.timeout: scoring pass exceeded 120000ms',
  ),
  mk('exec-tad-r-1', teamAlert, 'running', 'schedule', 0.05, undefined, 'system'),
  mk('exec-tad-c-1', teamAlert, 'cancelled', 'manual', 168, 2100, 'u-samzong'),
  mk('exec-prb-m-1', prReview, 'succeeded', 'manual', 3, 4800, 'u-samzong'),
  mk('exec-tad-m-1', teamAlert, 'succeeded', 'manual', 26, 5200, 'u-samzong'),
  mk('exec-ccew-test-1', churn, 'succeeded', 'test', 72, 3800, 'u-samzong'),
]

const secondary: Execution[] = secondaryIds.flatMap((s, idx) => {
  const spec: AppSpec = {
    appId: s.appId,
    idPrefix: `exec-${s.appId.split('-')[0]}`,
    versionId: s.versionId,
    baseTrigger: 'schedule',
    outputSummaryByStatus: {
      succeeded: 'Run complete.',
      failed: 'Upstream dependency returned non-2xx.',
      timeout: 'Run exceeded sandbox deadline.',
      running: 'Run in progress…',
    },
  }
  return Array.from({ length: 5 }, (_, i) =>
    mk(
      `${spec.idPrefix}-${idx}-${i + 1}`,
      spec,
      i === 4 && idx === 2 ? 'failed' : 'succeeded',
      spec.baseTrigger,
      (i + 1) * 24 + idx * 8,
      2200 + (i * 400 + idx * 500),
      'system',
      i === 4 && idx === 2 ? 'slow-query.reader: stream closed before EOF' : undefined,
    ),
  )
})

export const executionsSeed: Execution[] = [
  ...primary.flatMap(generatePrimary),
  ...coverage,
  ...secondary,
]
