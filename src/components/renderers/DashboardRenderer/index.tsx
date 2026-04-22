import { AlertTriangle, Activity, Users, Wallet } from 'lucide-react'

type HealthStatus = 'healthy' | 'warning' | 'critical'
type RiskLevel = 'info' | 'warn' | 'danger'

interface Customer {
  id: string
  name: string
  type: 'JV' | 'Subscription'
  yearOrder: string
  usagePct: number
  sla: number
  settle: string
  status: HealthStatus
  note: string
}

interface RiskAlert {
  id: string
  level: RiskLevel
  title: string
  time: string
  customer: string
}

interface SlaRow {
  customerId: string
  customerName: string
  targetSla: number
  actualSla: number
  breachCount: number
}

interface SettlementRow {
  customerId: string
  customerName: string
  type: Customer['type']
  amountCny: number
  direction: 'incoming' | 'outgoing'
  dueDate: string
}

interface CockpitData {
  updatedAt: string
  customers: Customer[]
  risks: RiskAlert[]
  sla: { target: number; actual: number; breachesMonth: number; rows: SlaRow[] }
  settlement: {
    grossIncomingCny: number
    grossOutgoingCny: number
    netCny: number
    rows: SettlementRow[]
  }
}

const COCKPIT_DATA: CockpitData = {
  updatedAt: '2026-04-22T09:00:00+08:00',
  customers: [
    {
      id: 'zj-gov',
      name: 'Zhejiang Gov Cloud',
      type: 'JV',
      yearOrder: '¥500M',
      usagePct: 90,
      sla: 99.93,
      settle: 'share ¥410K',
      status: 'critical',
      note: 'Contract 90% used · projected over-quota in ~18h',
    },
    {
      id: 'ncb',
      name: 'Nebula Bank',
      type: 'Subscription',
      yearOrder: '¥1.0B',
      usagePct: 81,
      sla: 99.97,
      settle: 'receivable ¥730K',
      status: 'critical',
      note: 'SLA breach recorded yesterday',
    },
    {
      id: 'some-saas',
      name: 'SaaS Vendor X',
      type: 'Subscription',
      yearOrder: '¥200M',
      usagePct: 15,
      sla: 99.99,
      settle: '',
      status: 'warning',
      note: '7-day usage −42% · churn risk',
    },
    {
      id: 'pufa',
      name: 'Pufa Bank',
      type: 'JV',
      yearOrder: '¥1.5B',
      usagePct: 42,
      sla: 99.99,
      settle: 'share ¥380K',
      status: 'healthy',
      note: 'Normal',
    },
    {
      id: 'sh-gov',
      name: 'Shanghai Gov',
      type: 'JV',
      yearOrder: '¥800M',
      usagePct: 56,
      sla: 99.95,
      settle: 'share ¥220K',
      status: 'healthy',
      note: 'Normal',
    },
  ],
  risks: [
    {
      id: 'r-01',
      level: 'danger',
      title: 'GPU #12 fault isolated · 31/32 online',
      time: '13:48',
      customer: 'platform',
    },
    {
      id: 'r-02',
      level: 'danger',
      title: 'Zhejiang Gov Cloud quota burst imminent (~18h)',
      time: '13:22',
      customer: 'zj-gov',
    },
    {
      id: 'r-03',
      level: 'warn',
      title: 'Nebula Bank P99 latency 412ms (target 300ms)',
      time: '12:05',
      customer: 'ncb',
    },
    {
      id: 'r-04',
      level: 'warn',
      title: 'SaaS Vendor X usage drop −42% w/w',
      time: '09:40',
      customer: 'some-saas',
    },
    {
      id: 'r-05',
      level: 'info',
      title: 'Monthly settlement run scheduled for 2026-04-30',
      time: '08:00',
      customer: 'platform',
    },
  ],
  sla: {
    target: 99.95,
    actual: 99.964,
    breachesMonth: 2,
    rows: [
      { customerId: 'zj-gov', customerName: 'Zhejiang Gov Cloud', targetSla: 99.95, actualSla: 99.93, breachCount: 1 },
      { customerId: 'ncb', customerName: 'Nebula Bank', targetSla: 99.95, actualSla: 99.97, breachCount: 1 },
      { customerId: 'some-saas', customerName: 'SaaS Vendor X', targetSla: 99.9, actualSla: 99.99, breachCount: 0 },
      { customerId: 'pufa', customerName: 'Pufa Bank', targetSla: 99.95, actualSla: 99.99, breachCount: 0 },
      { customerId: 'sh-gov', customerName: 'Shanghai Gov', targetSla: 99.95, actualSla: 99.95, breachCount: 0 },
    ],
  },
  settlement: {
    grossIncomingCny: 730_000,
    grossOutgoingCny: 1_010_000,
    netCny: -280_000,
    rows: [
      { customerId: 'ncb', customerName: 'Nebula Bank', type: 'Subscription', amountCny: 730_000, direction: 'incoming', dueDate: '2026-04-28' },
      { customerId: 'zj-gov', customerName: 'Zhejiang Gov Cloud', type: 'JV', amountCny: 410_000, direction: 'outgoing', dueDate: '2026-04-30' },
      { customerId: 'pufa', customerName: 'Pufa Bank', type: 'JV', amountCny: 380_000, direction: 'outgoing', dueDate: '2026-04-30' },
      { customerId: 'sh-gov', customerName: 'Shanghai Gov', type: 'JV', amountCny: 220_000, direction: 'outgoing', dueDate: '2026-04-30' },
    ],
  },
}

const STATUS_TONE: Record<HealthStatus, { dot: string; text: string; label: string }> = {
  healthy: { dot: 'bg-[#10b981]', text: 'text-[#047857]', label: 'Healthy' },
  warning: { dot: 'bg-[#f59e0b]', text: 'text-[#b45309]', label: 'Warning' },
  critical: { dot: 'bg-[#ef4444]', text: 'text-[#b91c1c]', label: 'Critical' },
}

const RISK_TONE: Record<RiskLevel, { bg: string; border: string; chip: string }> = {
  info: {
    bg: 'bg-accent-ultra',
    border: 'border-accent/20',
    chip: 'bg-accent text-white',
  },
  warn: {
    bg: 'bg-[#fef3c7]',
    border: 'border-[#fde68a]',
    chip: 'bg-[#b45309] text-white',
  },
  danger: {
    bg: 'bg-[#fee2e2]',
    border: 'border-[#fecaca]',
    chip: 'bg-[#b91c1c] text-white',
  },
}

export function DashboardRenderer() {
  const data = COCKPIT_DATA
  return (
    <div className="px-8 py-6 max-w-[1200px] mx-auto">
      <Header updatedAt={data.updatedAt} />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <CustomerHealthWidget customers={data.customers} />
        <RiskAlertsWidget risks={data.risks} />
        <SlaComplianceWidget sla={data.sla} />
        <RevenueSettlementWidget settlement={data.settlement} />
      </div>
    </div>
  )
}

function Header({ updatedAt }: { updatedAt: string }) {
  const date = new Date(updatedAt)
  const fmt = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-fg-muted">
          Business Cockpit · Token Factory
        </div>
        <h2 className="mt-1 text-[20px] font-extrabold text-fg leading-tight">
          Weekly operating view
        </h2>
        <p className="mt-2 text-[12.5px] text-fg-muted max-w-[640px]">
          Customer health, risk alerts, SLA compliance, and revenue settlement for the
          Token Factory programme.
        </p>
      </div>
      <div className="font-mono text-[11px] text-fg-subtle uppercase tracking-wider shrink-0">
        Refreshed {fmt}
      </div>
    </div>
  )
}

function WidgetShell({
  title,
  kicker,
  Icon,
  children,
  right,
}: {
  title: string
  kicker: string
  Icon: typeof Users
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <section className="bg-card border border-line rounded-[12px] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[9px] bg-accent-ultra border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <Icon size={16} />
          </div>
          <div>
            <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-fg-subtle">
              {kicker}
            </div>
            <div className="text-[15px] font-extrabold text-fg mt-[2px]">{title}</div>
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </section>
  )
}

function CustomerHealthWidget({ customers }: { customers: Customer[] }) {
  const critical = customers.filter((c) => c.status === 'critical').length
  const warnings = customers.filter((c) => c.status === 'warning').length

  return (
    <WidgetShell
      title="Customer Health"
      kicker="Portfolio"
      Icon={Users}
      right={
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-[#b91c1c] font-bold">{critical} critical</span>
          <span className="text-fg-subtle">·</span>
          <span className="text-[#b45309] font-bold">{warnings} warn</span>
        </div>
      }
    >
      <div className="space-y-[10px]">
        {customers.map((c) => (
          <CustomerRow key={c.id} customer={c} />
        ))}
      </div>
    </WidgetShell>
  )
}

function CustomerRow({ customer: c }: { customer: Customer }) {
  const tone = STATUS_TONE[c.status]
  return (
    <div className="flex items-start gap-3 py-2 border-b border-line-soft last:border-0">
      <div className={`w-[8px] h-[8px] rounded-full mt-[6px] ${tone.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-bold text-fg">{c.name}</span>
            <span className="font-mono text-[10px] px-[6px] py-[1px] rounded bg-bg border border-line text-fg-muted uppercase tracking-wider">
              {c.type}
            </span>
          </div>
          <span className={`font-mono text-[11px] font-bold ${tone.text}`}>
            {tone.label}
          </span>
        </div>
        <div className="mt-[5px] flex items-center gap-3 text-[11.5px] text-fg-muted">
          <span className="font-mono">year {c.yearOrder}</span>
          <span>·</span>
          <div className="flex-1 h-[6px] bg-bg rounded-full overflow-hidden min-w-[80px] max-w-[220px]">
            <div
              className={`h-full ${c.usagePct >= 85 ? 'bg-[#ef4444]' : c.usagePct >= 65 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'}`}
              style={{ width: `${Math.min(100, c.usagePct)}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-semibold text-fg w-[36px] text-right">
            {c.usagePct}%
          </span>
        </div>
        <div className="mt-[4px] text-[11.5px] text-fg-subtle truncate">{c.note}</div>
      </div>
    </div>
  )
}

function RiskAlertsWidget({ risks }: { risks: RiskAlert[] }) {
  return (
    <WidgetShell
      title="Risk Alerts"
      kicker="Live feed"
      Icon={AlertTriangle}
      right={
        <span className="font-mono text-[11px] text-fg-subtle uppercase tracking-wider">
          {risks.length} open
        </span>
      }
    >
      <div className="space-y-2">
        {risks.map((r) => (
          <RiskRow key={r.id} risk={r} />
        ))}
      </div>
    </WidgetShell>
  )
}

function RiskRow({ risk: r }: { risk: RiskAlert }) {
  const tone = RISK_TONE[r.level]
  return (
    <div className={`border ${tone.border} ${tone.bg} rounded-[9px] px-3 py-[10px] flex items-start gap-3`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${tone.chip}`}>
        <AlertTriangle size={12} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[12.5px] font-bold text-fg leading-tight">{r.title}</div>
          <div className="font-mono text-[10.5px] text-fg-subtle shrink-0">{r.time}</div>
        </div>
        <div className="mt-[3px] font-mono text-[10.5px] uppercase tracking-wider text-fg-subtle">
          {r.customer}
        </div>
      </div>
    </div>
  )
}

function SlaComplianceWidget({ sla }: { sla: CockpitData['sla'] }) {
  const delta = sla.actual - sla.target
  const deltaTone = delta >= 0 ? 'text-[#047857]' : 'text-[#b91c1c]'

  return (
    <WidgetShell
      title="SLA Compliance"
      kicker="This month"
      Icon={Activity}
      right={
        <div className="text-right">
          <div className="font-mono text-[18px] font-extrabold text-fg leading-none">
            {sla.actual.toFixed(3)}%
          </div>
          <div className={`font-mono text-[10px] mt-[3px] ${deltaTone}`}>
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(3)} vs target {sla.target}%
          </div>
        </div>
      }
    >
      <div className="mb-3 flex items-center gap-3 text-[11.5px] text-fg-muted">
        <span>
          <span className="font-mono font-bold text-fg">{sla.breachesMonth}</span> breaches
          logged this month
        </span>
      </div>
      <div className="space-y-[9px]">
        {sla.rows.map((row) => (
          <SlaRowView key={row.customerId} row={row} />
        ))}
      </div>
    </WidgetShell>
  )
}

function SlaRowView({ row }: { row: SlaRow }) {
  const ok = row.actualSla >= row.targetSla
  return (
    <div className="flex items-center gap-3 text-[11.5px]">
      <div className={`w-[6px] h-[6px] rounded-full ${ok ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`} />
      <div className="flex-1 min-w-0 truncate text-fg">{row.customerName}</div>
      <div className="font-mono text-fg-muted">target {row.targetSla}%</div>
      <div
        className={`font-mono font-bold w-[72px] text-right ${ok ? 'text-[#047857]' : 'text-[#b91c1c]'}`}
      >
        {row.actualSla}%
      </div>
      <div className="font-mono text-fg-subtle w-[56px] text-right">
        {row.breachCount} breach
      </div>
    </div>
  )
}

function RevenueSettlementWidget({
  settlement,
}: {
  settlement: CockpitData['settlement']
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CNY',
      maximumFractionDigits: 0,
    }).format(v)
  const netTone = settlement.netCny >= 0 ? 'text-[#047857]' : 'text-[#b91c1c]'
  return (
    <WidgetShell
      title="Revenue Settlement"
      kicker="April 2026"
      Icon={Wallet}
      right={
        <div className="text-right">
          <div className={`font-mono text-[18px] font-extrabold leading-none ${netTone}`}>
            {settlement.netCny >= 0 ? '+' : ''}
            {fmt(settlement.netCny)}
          </div>
          <div className="font-mono text-[10px] text-fg-subtle mt-[3px]">net this cycle</div>
        </div>
      }
    >
      <div className="flex items-center gap-4 mb-3 text-[11.5px]">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Incoming
          </div>
          <div className="font-mono font-bold text-[#047857]">
            {fmt(settlement.grossIncomingCny)}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
            Outgoing
          </div>
          <div className="font-mono font-bold text-[#b91c1c]">
            {fmt(settlement.grossOutgoingCny)}
          </div>
        </div>
      </div>
      <div className="space-y-[7px]">
        {settlement.rows.map((r) => (
          <div key={r.customerId} className="flex items-center gap-3 text-[11.5px]">
            <div
              className={`px-2 py-[2px] rounded-[5px] border font-mono text-[10px] font-bold uppercase tracking-wider ${
                r.direction === 'incoming'
                  ? 'border-[#a7f3d0] bg-[#d1fae5] text-[#047857]'
                  : 'border-[#fde68a] bg-[#fef3c7] text-[#b45309]'
              }`}
            >
              {r.direction}
            </div>
            <div className="flex-1 min-w-0 truncate text-fg">{r.customerName}</div>
            <div className="font-mono text-[10px] text-fg-subtle">{r.type}</div>
            <div className="font-mono font-bold text-fg w-[88px] text-right">
              {fmt(r.amountCny)}
            </div>
            <div className="font-mono text-fg-subtle w-[82px] text-right">{r.dueDate}</div>
          </div>
        ))}
      </div>
    </WidgetShell>
  )
}
