import { useMemo, useState } from 'react'

/* =============================================================================
 * Business Cockpit · Token Factory
 * 1-page operating view with ~20 widgets ported from the legacy cockpit.html
 * prototype. Layout grouped into four implicit sections — Customers, Internal,
 * FinOps, Command. No nested tabs; Forge's outer Preview tab is enough.
 * Design tokens follow project scheme (bg-card / border-line / text-fg* /
 * accent). Semantic colors inlined as hex, consistent with AuditTab / Sidebar.
 * ========================================================================== */

/* ───── Types ─────────────────────────────────────────────────────────────── */

type RiskStatus = 'healthy' | 'warning' | 'critical'
type ContractFilter = 'all' | 'jv' | 'sub' | 'red' | 'yellow'

interface Customer {
  id: string
  name: string
  type: 'JV' | 'Subscription'
  yearOrder: string
  usagePct: number
  sla: number
  settle: string
  status: RiskStatus
  note: string
}

interface Todo {
  id: string
  customer: string
  text: string
}

interface EmployeeCard {
  id: string
  avatar: string
  name: string
  role: string
  status: 'online' | 'busy'
  monthTasks: number
  tokens: string
  savedCost: string
}

interface TeamRank {
  name: string
  tokens: string
  savedCost: string
  pct: number
}

interface DeptBar {
  name: string
  tokens: string
  pct: number
  bar: string
}

interface AlertRow {
  level: 'success' | 'warning' | 'danger'
  title: string
  time: string
  jumpCard?: string
}

interface WaterfallSeg {
  name: string
  value: number
  type: 'in' | 'out' | 'net'
}

interface RoiRow {
  rank: number
  model: string
  tenant: string
  profit?: number
  loss?: number
  severe?: boolean
}

interface SupplyRow {
  id: string
  name: string
  origin: 'In-house' | 'Proxy'
  license: string
  status: 'ok' | 'warn' | 'fail'
  stock: string
  usePct: number
  note: string
}

interface FinOpsCard {
  label: string
  value: string
  meta: string
  tone: 'emerald' | 'cyan' | 'violet' | 'amber'
}

interface ClusterCard {
  label: string
  value: string | number
  meta: string
  tone: 'emerald' | 'cyan' | 'amber' | 'rose'
}

interface Policy {
  id: string
  age: string
  label: string
  by: string
  expires?: string
  tag?: string
  auto?: boolean
}

interface Lever {
  id: string
  label: string
  actions: string
  icon: string
}

interface AuditRow {
  time: string
  who: string
  what: string
  impact: string
  ok: boolean
  rollback: boolean
}

/* ───── Data (static, demo-only) ──────────────────────────────────────────── */

const CUSTOMERS: Customer[] = [
  { id: 'zj-gov',    name: 'Zhejiang Gov Cloud', type: 'JV',           yearOrder: '¥500M',  usagePct: 90, sla: 99.93, settle: 'share ¥410K',      status: 'critical', note: 'Contract 90% used · projected over-quota in ~18h' },
  { id: 'ncb',       name: 'Nebula Bank',        type: 'Subscription', yearOrder: '¥1.0B',  usagePct: 81, sla: 99.97, settle: 'receivable ¥730K', status: 'critical', note: 'SLA breach recorded yesterday' },
  { id: 'some-saas', name: 'SaaS Vendor X',      type: 'Subscription', yearOrder: '¥200M',  usagePct: 15, sla: 99.99, settle: '',                 status: 'warning',  note: '7-day usage −42% · churn risk' },
  { id: 'pufa',      name: 'Pufa Bank',          type: 'JV',           yearOrder: '¥1.5B',  usagePct: 42, sla: 99.99, settle: 'share ¥380K',      status: 'healthy',  note: 'Normal' },
  { id: 'sh-gov',    name: 'Shanghai Gov',       type: 'JV',           yearOrder: '¥800M',  usagePct: 56, sla: 99.95, settle: 'share ¥220K',      status: 'healthy',  note: 'Normal' },
]

function actionsForCustomer(c: Customer): string[] {
  const base =
    c.type === 'JV'
      ? ['Expand draft', 'Generate monthly', 'Sovereign audit', 'Apologise + credit']
      : ['Expand draft', 'VIP upgrade', 'Throttle', 'Apologise + credit', 'Renewal']
  if (c.status === 'critical' || c.status === 'warning') return [...base, 'Diagnose →FinOps']
  return base
}

const HERO = {
  revenue:    { value: '¥830M',  note: '+12%',     noteTone: 'emerald' as const },
  delivered:  { value: '12.7B',  note: '/18.9B',   noteTone: 'subtle' as const },
  completion: { value: '67%',    note: 'on pace',  noteTone: 'emerald' as const },
  redlines:   { value: 3,         note: 'alerts',   noteTone: 'red' as const },
  yellow:     { value: 8,         note: 'watch',    noteTone: 'amber' as const },
  mau:        { value: '124K',   note: '+3.2%',    noteTone: 'emerald' as const },
}

const DOWNSTREAM = {
  mau: '124K',
  conversion: '3.2%',
  arpu: '¥87',
  topSources: [
    { name: 'Gov Cloud Portal', mau: '41K', pct: 100 },
    { name: 'Pufa Wallet',      mau: '38K', pct: 92 },
    { name: 'Finance SaaS X',   mau: '21K', pct: 51 },
  ],
  rpm: '¥23,411',
  spark: [3, 5, 7, 9, 12, 15, 14, 11, 8, 6, 4, 3, 5, 8, 11, 13],
}

const TODOS_INIT: Todo[] = [
  { id: 't1', customer: 'Zhejiang Gov Cloud', text: 'Contract 90% used · discuss renewal & expansion' },
  { id: 't2', customer: 'SaaS Vendor X',      text: 'Usage dropped 42% · diagnose churn signals' },
  { id: 't3', customer: 'Nebula Bank',        text: 'Yesterday SLA breach · apologise + credit' },
  { id: 't4', customer: 'Finance SaaS X',     text: 'Monthly usage 95% · reach out before cap' },
  { id: 't5', customer: 'Shanghai Gov',       text: 'Quarterly settlement · generate statement' },
]

const HOURLY = {
  hours: Array.from({ length: 24 }, (_, i) => i),
  revenue: [3.2, 3.0, 2.4, 2.5, 2.7, 2.9, 3.0, 3.3, 3.6, 3.8, 4.0, 4.1, 4.2, 4.3, 4.4, 4.3, 4.1, 3.9, 3.8, 3.7, 3.6, 3.5, 3.4, 3.3],
  cost:    [2.5, 2.4, 2.6, 2.0, 2.1, 2.2, 2.3, 2.5, 2.7, 2.9, 3.0, 3.1, 3.2, 3.3, 3.3, 3.3, 3.2, 3.1, 3.0, 2.9, 2.8, 2.7, 2.6, 2.5],
  margin:  [0.7, 0.6, -0.2, 0.5, 0.6, 0.7, 0.7, 0.8, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0, 1.1, 1.0, 0.9, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
  alertHour: 2,
  alertHourLabel: '02:17',
  alertMsg: 'Instant margin dropped below 0 · L-70B × XYZ tenant',
}

const WATERFALL: WaterfallSeg[] = [
  { name: 'Revenue',                value: 8.32,  type: 'in' },
  { name: '− GPU depreciation',     value: -2.10, type: 'out' },
  { name: '− Power',                value: -0.84, type: 'out' },
  { name: '− Bandwidth',            value: -0.31, type: 'out' },
  { name: '− Model licensing',      value: -0.97, type: 'out' },
  { name: '− Scheduling overhead',  value: -0.18, type: 'out' },
  { name: 'Net margin',             value: 3.92,  type: 'net' },
]

const ROI_GOLD: RoiRow[] = [
  { rank: 1, model: 'Q-14B',   tenant: 'Nebula',        profit: 1.23 },
  { rank: 2, model: 'Q-14B',   tenant: 'Pufa',          profit: 1.11 },
  { rank: 3, model: 'V-7B',    tenant: 'Gov Cloud',     profit: 0.92 },
  { rank: 4, model: 'Q-14B',   tenant: 'Retail pool',   profit: 0.74 },
  { rank: 5, model: 'V-7B',    tenant: 'SaaS Vendor X', profit: 0.61 },
]

const ROI_BLEED: RoiRow[] = [
  { rank: 1, model: 'L-70B',      tenant: 'XYZ',          loss: 0.08, severe: true },
  { rank: 2, model: 'L-70B',      tenant: 'C-end pool',   loss: 0.03 },
  { rank: 3, model: 'Long ctx',   tenant: 'Retail pool',  loss: 0.01 },
]

const SUPPLY: SupplyRow[] = [
  { id: 'qwen',     name: 'Qwen2.5-72B', origin: 'In-house', license: 'N/A',               status: 'ok',   stock: '28 cards',              usePct: 0,   note: 'Healthy' },
  { id: 'llama',    name: 'Llama-3-70B', origin: 'In-house', license: 'Meta agreement',    status: 'ok',   stock: '12 cards',              usePct: 0,   note: 'Healthy' },
  { id: 'deepseek', name: 'DeepSeek-V3', origin: 'In-house', license: 'MIT',               status: 'ok',   stock: '8 cards',               usePct: 0,   note: 'Healthy' },
  { id: 'claude',   name: 'Claude',      origin: 'Proxy',    license: 'Anthropic API',     status: 'warn', stock: '320M tokens / mo left', usePct: 67,  note: '67% used this month' },
  { id: 'gpt5',     name: 'GPT-5',       origin: 'Proxy',    license: 'Azure OpenAI',      status: 'warn', stock: '180M tokens / mo left', usePct: 73,  note: '73% used this month' },
  { id: 'gemini',   name: 'Gemini Pro',  origin: 'Proxy',    license: 'Google API',        status: 'fail', stock: 'failover active',       usePct: 100, note: 'Flapped 3× yesterday' },
]

const MODEL_CONSUMPTION: Record<string, string> = {
  qwen: '12.5M', llama: '8.5M', deepseek: '5.8M', claude: '3.2M', gpt5: '2.1M', gemini: '—',
}

const FINOPS_SUPPL: FinOpsCard[] = [
  { label: 'Unit cost / token', value: '¥0.307', meta: '−5.2% vs last mo',    tone: 'emerald' },
  { label: 'GPU utilisation',   value: '78.4%',  meta: '25.6 PFLOPS',          tone: 'cyan'    },
  { label: 'Tokens today',      value: '12.5M',  meta: '+8.3% vs yesterday',   tone: 'emerald' },
  { label: 'Monthly ROI',       value: '3.2×',   meta: 'exceeds target',       tone: 'violet'  },
]

const INTERNAL_AGG = {
  onlineEmployees: 24,
  activeAgents: 18,
  successRate: '97.3%',
  effGain: '4.2×',
  dailySaved: '¥21K',
}

const INTERNAL_EMPLOYEES: EmployeeCard[] = [
  { id: 'ops',  avatar: 'OP', name: 'DevOps Copilot',  role: 'Inspection · alerts · self-heal',  status: 'online', monthTasks: 342, tokens: '8.2M',  savedCost: '¥18K' },
  { id: 'risk', avatar: 'RK', name: 'Risk Reviewer',   role: 'Transaction review · compliance',   status: 'online', monthTasks: 486, tokens: '12.5M', savedCost: '¥26K' },
  { id: 'cs',   avatar: 'CS', name: 'Support Lead',    role: 'Q&A · triage · ticket routing',     status: 'busy',   monthTasks: 430, tokens: '15.8M', savedCost: '¥32K' },
  { id: 'data', avatar: 'DA', name: 'Insight Agent',   role: 'Reports · anomaly detection',       status: 'online', monthTasks: 156, tokens: '6.3M',  savedCost: '¥11K' },
]

const INTERNAL_TEAMS: TeamRank[] = [
  { name: 'Customer Support', tokens: '28.5M', savedCost: '¥86K', pct: 95 },
  { name: 'Risk Control',     tokens: '24.2M', savedCost: '¥73K', pct: 80 },
  { name: 'Ops Analytics',    tokens: '18.7M', savedCost: '¥56K', pct: 62 },
  { name: 'Marketing',        tokens: '12.1M', savedCost: '¥36K', pct: 40 },
]

const DEPT_DEMAND: DeptBar[] = [
  { name: 'Customer Support', tokens: '18.5M', pct: 100, bar: 'bg-[#10b981]' },
  { name: 'Risk Control',     tokens: '12.8M', pct: 69,  bar: 'bg-[#06b6d4]' },
  { name: 'Ops Analytics',    tokens: '8.2M',  pct: 44,  bar: 'bg-[#8b5cf6]' },
  { name: 'Marketing',        tokens: '3.5M',  pct: 19,  bar: 'bg-[#f59e0b]' },
]

const CLUSTER_OVERVIEW: ClusterCard[] = [
  { label: 'Total compute',    value: '32 GPU', meta: 'H100×24 · Ascend×8',      tone: 'emerald' },
  { label: 'GPU utilisation',  value: '78.4%',  meta: 'avg load',                 tone: 'cyan'    },
  { label: 'Cluster health',   value: '96.9%',  meta: '1 degraded · 0 offline',   tone: 'amber'   },
  { label: 'Hardware alerts',  value: 2,        meta: 'VRAM×1 · thermal×1',       tone: 'rose'    },
]

const FACTORY_ALERTS: AlertRow[] = [
  { level: 'success', title: 'Token output on track · goal 108% hit',              time: '14:32' },
  { level: 'warning', title: 'Llama-3 P95 latency 128ms · monitoring',             time: '14:15' },
  { level: 'danger',  title: 'GPU #12 fault isolated · 31/32 online',              time: '13:48', jumpCard: 'r1-n3-c5' },
]

const ACTIVE_POLICIES: Policy[] = [
  { id: 'a1', age: '00:14', label: 'Q-14B v2 canary 30%',        by: 'Zhang' },
  { id: 'a2', age: '00:08', label: 'Nebula Bank +20% capacity',  by: 'Zhang', expires: '4h' },
  { id: 'a3', age: '23:47', label: 'L-70B pricing −15%',         by: 'Zhang', tag: 'Flash sale' },
  { id: 'a4', age: '23:22', label: 'XYZ throttled 2k RPS',       by: 'System', auto: true },
  { id: 'a5', age: '22:15', label: 'Wartime lockdown · VIP save', by: 'Zhang' },
]

const LEVERS: Lever[] = [
  { id: 'version', label: 'Model version', actions: 'Canary / rollback',           icon: '◐' },
  { id: 'quota',   label: 'Tenant quota',  actions: 'Expand / throttle / VIP',     icon: '▣' },
  { id: 'pricing', label: 'Pricing',       actions: 'Unit / discount / tier',      icon: '¥' },
  { id: 'route',   label: 'Routing',       actions: 'Large/small · region',        icon: '⇄' },
  { id: 'fuse',    label: 'Fuse',          actions: 'Emergency offline',           icon: '⚠' },
  { id: 'wartime', label: 'Wartime',       actions: 'VIP save · freeze changes',   icon: '🛡' },
]

const AUDIT_INIT: AuditRow[] = [
  { time: '00:14', who: 'Zhang',  what: 'Q-14B v2 canary 0→30%',      impact: '8 tenants',     ok: true, rollback: true },
  { time: '00:08', who: 'Zhang',  what: 'Nebula Bank +20% capacity',  impact: '1 tenant',      ok: true, rollback: true },
  { time: '23:52', who: 'Li',     what: 'L-70B pricing −15%',         impact: 'C-end pool',    ok: true, rollback: true },
  { time: '23:47', who: 'System', what: 'XYZ fuse throttled',         impact: '1 tenant',      ok: true, rollback: false },
]

/* ───── Status styling ────────────────────────────────────────────────────── */

const STATUS_BAR: Record<RiskStatus, string> = {
  critical: 'bg-[#ef4444]',
  warning:  'bg-[#f59e0b]',
  healthy:  'bg-line',
}

const STATUS_DOT_CHAR: Record<RiskStatus, string> = {
  critical: '●',
  warning:  '●',
  healthy:  '○',
}

const STATUS_DOT_COLOR: Record<RiskStatus, string> = {
  critical: 'text-[#ef4444]',
  warning:  'text-[#b45309]',
  healthy:  'text-fg-subtle',
}

const STATUS_NOTE: Record<RiskStatus, string> = {
  critical: 'text-[#b91c1c]',
  warning:  'text-[#b45309]',
  healthy:  'text-fg-muted',
}

const NOTE_TONE: Record<'emerald' | 'subtle' | 'red' | 'amber', string> = {
  emerald: 'text-[#047857]',
  subtle:  'text-fg-subtle',
  red:     'text-[#b91c1c]',
  amber:   'text-[#b45309]',
}

const HERO_VALUE_TONE: Record<keyof typeof HERO, string> = {
  revenue: 'text-fg',
  delivered: 'text-fg',
  completion: 'text-fg',
  redlines: 'text-[#b91c1c]',
  yellow: 'text-[#b45309]',
  mau: 'text-fg',
}

const FINOPS_TONE: Record<FinOpsCard['tone'], string> = {
  emerald: 'text-[#047857]',
  cyan:    'text-[#0e7490]',
  violet:  'text-accent',
  amber:   'text-[#b45309]',
}

const CLUSTER_TONE: Record<ClusterCard['tone'], string> = {
  emerald: 'text-[#047857]',
  cyan:    'text-[#0e7490]',
  amber:   'text-[#b45309]',
  rose:    'text-[#be123c]',
}

const ALERT_BORDER: Record<AlertRow['level'], string> = {
  success: 'border-l-[#10b981]',
  warning: 'border-l-[#f59e0b]',
  danger:  'border-l-[#ef4444]',
}

const ALERT_CHIP: Record<AlertRow['level'], string> = {
  success: 'bg-[#d1fae5] text-[#047857]',
  warning: 'bg-[#fef3c7] text-[#b45309]',
  danger:  'bg-[#fee2e2] text-[#b91c1c]',
}

const ALERT_ICON_CHAR: Record<AlertRow['level'], string> = {
  success: '✓', warning: '!', danger: '!',
}

const HERO_LABEL: Record<keyof typeof HERO, string> = {
  revenue: 'MTD revenue',
  delivered: 'Delivered tokens',
  completion: 'Contract progress',
  redlines: 'Redlines',
  yellow: 'Yellow flags',
  mau: 'Downstream MAU',
}

/* ───── Root ──────────────────────────────────────────────────────────────── */

export function DashboardRenderer() {
  const [filter, setFilter] = useState<ContractFilter>('all')
  const [todoDone, setTodoDone] = useState<Record<string, boolean>>({})
  const [lever, setLever] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [pricing, setPricing] = useState(5)
  const [qPrice, setQPrice] = useState(-2)
  const [lQuota, setLQuota] = useState(10)
  const [ladder, setLadder] = useState(true)
  const [audit, setAudit] = useState<AuditRow[]>(AUDIT_INIT)
  const [policies, setPolicies] = useState<Policy[]>(ACTIVE_POLICIES)

  const filteredCustomers = useMemo(() => {
    switch (filter) {
      case 'jv':     return CUSTOMERS.filter((c) => c.type === 'JV')
      case 'sub':    return CUSTOMERS.filter((c) => c.type === 'Subscription')
      case 'red':    return CUSTOMERS.filter((c) => c.status === 'critical')
      case 'yellow': return CUSTOMERS.filter((c) => c.status === 'warning')
      default:       return CUSTOMERS
    }
  }, [filter])

  const whatIf = useMemo(() => {
    const base = 23.7
    const delta = pricing * 0.3 + qPrice * -0.1 + lQuota * 0.05 + (ladder ? 0.5 : 0)
    const newRate = base + delta
    const monthGain = (delta / base) * 3.92
    return {
      newRate: newRate.toFixed(1),
      delta: delta.toFixed(1),
      monthGain: monthGain.toFixed(2),
      atRisk: pricing >= 5 ? 3 : 0,
    }
  }, [pricing, qPrice, lQuota, ladder])

  const toggleTodo = (id: string) =>
    setTodoDone((prev) => ({ ...prev, [id]: !prev[id] }))

  const completedTodos = Object.values(todoDone).filter(Boolean).length

  const revokePolicy = (id: string) =>
    setPolicies((prev) => prev.filter((p) => p.id !== id))

  const pushAudit = (row: AuditRow) => setAudit((prev) => [row, ...prev])

  return (
    <div className="px-6 py-5">
      <CockpitHeader />

      {/* Hero strip */}
      <div className="mt-5 grid grid-cols-3 md:grid-cols-6 gap-3">
        {(Object.keys(HERO) as Array<keyof typeof HERO>).map((k) => (
          <HeroCard
            key={k}
            label={HERO_LABEL[k]}
            value={HERO[k].value}
            note={HERO[k].note}
            valueClass={HERO_VALUE_TONE[k]}
            noteClass={NOTE_TONE[HERO[k].noteTone]}
          />
        ))}
      </div>

      {/* Customers × Downstream */}
      <div className="mt-5 grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ContractsList
            customers={filteredCustomers}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>
        <div className="xl:col-span-2">
          <DownstreamPanel />
        </div>
      </div>

      {/* Today's call queue */}
      <div className="mt-4">
        <TodoQueue
          todos={TODOS_INIT}
          doneMap={todoDone}
          onToggle={toggleTodo}
          completed={completedTodos}
        />
      </div>

      {/* Internal consumption */}
      <div className="mt-6">
        <InternalConsumerBanner />
      </div>
      <div className="mt-3 grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INTERNAL_EMPLOYEES.map((e) => (
            <InternalEmployeeCardView key={e.id} emp={e} />
          ))}
        </div>
        <div className="xl:col-span-2">
          <InternalTeamRank />
        </div>
      </div>
      <div className="mt-3">
        <DeptDemandPanel />
      </div>

      {/* FinOps */}
      <SectionHeader className="mt-8" kicker="FinOps" title="Economic surface — 24h" />
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {FINOPS_SUPPL.map((c, i) => (
          <FinOpsCardView key={i} card={c} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ThreeLineChart />
        </div>
        <div className="lg:col-span-2">
          <RoiList />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WaterfallChart />
        </div>
        <div className="lg:col-span-2">
          <WhatIfPanel
            pricing={pricing}
            setPricing={setPricing}
            qPrice={qPrice}
            setQPrice={setQPrice}
            lQuota={lQuota}
            setLQuota={setLQuota}
            ladder={ladder}
            setLadder={setLadder}
            whatIf={whatIf}
          />
        </div>
      </div>
      <div className="mt-4">
        <SupplyView />
      </div>

      {/* Command Room */}
      <SectionHeader className="mt-8" kicker="Command Room" title="Levers · impact · audit" />
      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ClusterOverview />
        </div>
        <div className="lg:col-span-2">
          <FactoryAlerts />
        </div>
      </div>
      <div className="mt-4">
        <WarRoom policies={policies} onRevoke={revokePolicy} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <LeversPanel selected={lever} onSelect={setLever} />
        <ImpactPreview
          reason={reason}
          onReasonChange={setReason}
          onExecute={() => {
            if (!reason.trim()) return
            pushAudit({
              time: new Date().toTimeString().slice(0, 5),
              who: 'Zhang',
              what: 'Policy draft executed',
              impact: '1 tenant',
              ok: true,
              rollback: true,
            })
            setReason('')
          }}
        />
      </div>
      <div className="mt-4">
        <AuditFeed audit={audit} />
      </div>
    </div>
  )
}

/* ───── Header ────────────────────────────────────────────────────────────── */

function CockpitHeader() {
  const fmt = new Date('2026-04-22T09:00:00+08:00').toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-fg-muted">
          Business Cockpit · Token Factory
        </div>
        <h2 className="mt-1 text-[22px] font-extrabold text-fg leading-tight">
          Weekly operating view
        </h2>
        <p className="mt-2 text-[12.5px] text-fg-muted max-w-[720px]">
          Customers, internal consumption, FinOps, and a command room for
          canary/quota/pricing levers — every move enters the shared audit
          stream.
        </p>
      </div>
      <div className="font-mono text-[11px] text-fg-subtle uppercase tracking-wider shrink-0">
        Refreshed {fmt}
      </div>
    </div>
  )
}

function SectionHeader({
  kicker,
  title,
  className = '',
}: {
  kicker: string
  title: string
  className?: string
}) {
  return (
    <div className={className}>
      <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-fg-subtle">
        {kicker}
      </div>
      <div className="text-[16px] font-extrabold text-fg mt-[3px]">{title}</div>
    </div>
  )
}

/* ───── Hero card ─────────────────────────────────────────────────────────── */

function HeroCard({
  label,
  value,
  note,
  valueClass,
  noteClass,
}: {
  label: string
  value: string | number
  note: string
  valueClass: string
  noteClass: string
}) {
  return (
    <div className="bg-card border border-line rounded-[10px] p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
        {label}
      </div>
      <div className={`font-mono text-[22px] font-bold mt-1 leading-none ${valueClass}`}>
        {value}
      </div>
      <div className={`font-mono text-[10px] mt-1 ${noteClass}`}>{note}</div>
    </div>
  )
}

/* ───── Contracts ─────────────────────────────────────────────────────────── */

const FILTER_OPTIONS: Array<{ value: ContractFilter; label: string }> = [
  { value: 'all',    label: 'All' },
  { value: 'jv',     label: 'JV' },
  { value: 'sub',    label: 'Subscription' },
  { value: 'red',    label: 'Critical' },
  { value: 'yellow', label: 'Warning' },
]

function ContractsList({
  customers,
  filter,
  onFilterChange,
}: {
  customers: Customer[]
  filter: ContractFilter
  onFilterChange: (f: ContractFilter) => void
}) {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4 h-full">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            Enterprise contracts
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            Sorted by risk · Critical → Warning → Healthy
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          {FILTER_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => onFilterChange(o.value)}
              className={`px-2 py-[3px] rounded-[6px] font-mono uppercase tracking-wider transition-colors ${
                filter === o.value
                  ? 'bg-fg text-white'
                  : 'text-fg-muted hover:bg-line-soft'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {customers.map((c) => (
          <CustomerRow key={c.id} customer={c} />
        ))}
      </div>
    </section>
  )
}

function CustomerRow({ customer: c }: { customer: Customer }) {
  const actions = actionsForCustomer(c)
  return (
    <div className="border border-line rounded-[10px] p-3 hover:border-accent/30 hover:shadow-[0_6px_20px_-12px_rgba(37,99,235,0.2)] transition-all bg-card cursor-pointer">
      <div className="flex items-start gap-3">
        <span className={`text-[13px] mt-[3px] ${STATUS_DOT_COLOR[c.status]}`}>
          {STATUS_DOT_CHAR[c.status]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase text-fg-subtle">[{c.type}]</span>
            <span className="text-[14px] font-bold text-fg">{c.name}</span>
            <span className="font-mono text-[10px] text-fg-subtle">year {c.yearOrder}</span>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-bg rounded-full overflow-hidden">
              <div className={`h-full ${STATUS_BAR[c.status]}`} style={{ width: `${c.usagePct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10.5px] text-fg-muted">
              <span>
                SLA <span className="font-mono text-fg">{c.sla}%</span> · {c.settle || '—'}
              </span>
              <span className="font-mono">{c.usagePct}%</span>
            </div>
          </div>
          <div className={`text-[11px] mt-[6px] ${STATUS_NOTE[c.status]}`}>{c.note}</div>
          <div className="flex flex-wrap gap-[6px] mt-[9px]">
            {actions.map((a, i) => {
              const isDiag = a.startsWith('Diagnose')
              return (
                <button
                  key={i}
                  className={`text-[10.5px] px-2 py-[3px] rounded-[6px] font-medium transition-colors ${
                    isDiag
                      ? 'bg-accent text-white hover:bg-[#1d4ed8]'
                      : 'bg-line-soft text-fg-muted hover:bg-line'
                  }`}
                >
                  {a}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───── Downstream ────────────────────────────────────────────────────────── */

function DownstreamPanel() {
  const spark = DOWNSTREAM.spark
  const max = Math.max(...spark)
  const points = spark
    .map((v, i) => `${(i / (spark.length - 1)) * 100},${30 - (v / max) * 26}`)
    .join(' ')
  return (
    <section className="bg-card border border-line rounded-[12px] p-4 h-full flex flex-col">
      <div className="bg-[#fef3c7] border border-[#fde68a] rounded-[8px] p-2 mb-3 text-[10.5px] text-[#b45309] leading-snug">
        ⚠ These are our <strong>customers' end users</strong> in aggregate — not our own
        retail base (strategic boundary).
      </div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold mb-2">
        Downstream C-end (aggregate)
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <DsStat label="Total MAU" value={DOWNSTREAM.mau} />
        <DsStat label="Paid conv" value={DOWNSTREAM.conversion} />
        <DsStat label="Avg ARPU" value={DOWNSTREAM.arpu} />
      </div>
      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold mb-[6px]">
          Top 3 sources
        </div>
        <div className="space-y-[6px]">
          {DOWNSTREAM.topSources.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-20 text-[11px] text-fg truncate">{s.name}</div>
              <div className="flex-1 h-3 bg-bg rounded">
                <div className="h-full bg-[#06b6d4] rounded" style={{ width: `${s.pct}%` }} />
              </div>
              <div className="w-12 text-right font-mono text-[10px] text-fg-muted">{s.mau}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold mb-[6px]">
          Live aggregate flow
        </div>
        <div className="flex items-baseline gap-2">
          <div className="font-mono text-[18px] font-bold text-fg">{DOWNSTREAM.rpm}</div>
          <div className="text-[10px] text-fg-subtle">/ min ↑</div>
        </div>
        <svg viewBox="0 0 100 32" className="w-full h-8 mt-1">
          <polyline fill="none" stroke="#06b6d4" strokeWidth="1.5" points={points} />
          <polyline fill="rgba(6,182,212,0.12)" stroke="none" points={`0,32 ${points} 100,32`} />
        </svg>
      </div>
      <button className="mt-auto text-[11px] text-accent hover:underline font-medium text-left">
        Deep dive by customer → (immersive page, prototype only)
      </button>
    </section>
  )
}

function DsStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-fg-subtle">{label}</div>
      <div className="font-mono text-[16px] font-bold text-fg mt-[2px]">{value}</div>
    </div>
  )
}

/* ───── Todo queue ────────────────────────────────────────────────────────── */

function TodoQueue({
  todos,
  doneMap,
  onToggle,
  completed,
}: {
  todos: Todo[]
  doneMap: Record<string, boolean>
  onToggle: (id: string) => void
  completed: number
}) {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4">
      <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            Today's calls
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            Actionable queue · persistent · auto-archived after 7 days
          </div>
        </div>
        <div className="text-[10.5px] text-fg-subtle font-mono">
          {completed} / {todos.length} done
        </div>
      </div>
      <div className="space-y-[2px]">
        {todos.map((t) => {
          const done = !!doneMap[t.id]
          return (
            <label
              key={t.id}
              className={`flex items-center gap-2 text-[12px] border-b border-line-soft py-[6px] cursor-pointer ${done ? 'opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => onToggle(t.id)}
                className="accent-[#10b981]"
              />
              <span className="font-semibold text-fg">{t.customer}</span>
              <span className="text-fg-subtle">·</span>
              <span className={`flex-1 ${done ? 'line-through text-fg-subtle' : 'text-fg-muted'}`}>
                {t.text}
              </span>
              {!done && (
                <span className="text-[10px] px-2 py-[2px] bg-accent-ultra border border-accent/20 text-accent rounded-[6px] font-medium">
                  → Act
                </span>
              )}
            </label>
          )
        })}
      </div>
    </section>
  )
}

/* ───── Internal ──────────────────────────────────────────────────────────── */

function InternalConsumerBanner() {
  const items = [
    { label: 'Online employees',  value: INTERNAL_AGG.onlineEmployees, tone: 'text-fg' },
    { label: 'Active agents',     value: INTERNAL_AGG.activeAgents,     tone: 'text-fg' },
    { label: 'Task success',      value: INTERNAL_AGG.successRate,      tone: 'text-[#047857]' },
    { label: 'Efficiency',        value: INTERNAL_AGG.effGain,           tone: 'text-fg' },
    { label: 'Daily saved',       value: INTERNAL_AGG.dailySaved,       tone: 'text-[#047857]' },
  ]
  return (
    <section className="flex items-center gap-6 px-4 py-3 bg-card border border-line rounded-[12px] flex-wrap">
      <div className="pr-4 border-r border-line shrink-0">
        <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
          Internal consumer
        </div>
        <div className="text-[13px] font-bold text-fg mt-[2px]">Digital employees & agents</div>
      </div>
      {items.map((it, i) => (
        <div key={i}>
          <div className={`font-mono text-[18px] font-bold leading-none ${it.tone}`}>{it.value}</div>
          <div className="text-[10px] text-fg-subtle mt-[3px]">{it.label}</div>
        </div>
      ))}
      <div className="flex-1 min-w-[20px]" />
      <div className="text-[10px] text-fg-subtle max-w-[220px] text-right leading-tight">
        Internal token usage shown alongside external customers.
      </div>
    </section>
  )
}

function InternalEmployeeCardView({ emp }: { emp: EmployeeCard }) {
  const statusCls =
    emp.status === 'online'
      ? 'bg-[#d1fae5] text-[#047857] border-[#a7f3d0]'
      : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
  const statusLabel = emp.status === 'online' ? 'Running' : 'High load'
  return (
    <div className="bg-card border border-line rounded-[12px] p-3 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-[9px] bg-accent-ultra text-accent font-mono text-[11px] font-extrabold flex items-center justify-center border border-accent/20">
          {emp.avatar}
        </div>
        <span className={`text-[10px] px-2 py-[2px] rounded-[5px] border font-semibold ${statusCls}`}>
          {statusLabel}
        </span>
      </div>
      <div className="mt-2 text-[13px] font-bold text-fg leading-tight">{emp.name}</div>
      <div className="text-[10px] text-fg-muted mt-[2px]">{emp.role}</div>
      <div className="grid grid-cols-3 gap-1 mt-3 pt-2 border-t border-line-soft">
        <MicroStat value={String(emp.monthTasks)} label="Tasks / mo" />
        <MicroStat value={emp.tokens} label="Tokens" />
        <MicroStat value={emp.savedCost} label="Saved" tone="text-[#047857]" />
      </div>
    </div>
  )
}

function MicroStat({ value, label, tone = 'text-fg' }: { value: string; label: string; tone?: string }) {
  return (
    <div>
      <div className={`font-mono text-[13px] font-bold leading-none ${tone}`}>{value}</div>
      <div className="text-[9px] text-fg-subtle mt-[5px]">{label}</div>
    </div>
  )
}

function InternalTeamRank() {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4 h-full">
      <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold mb-3">
        Internal team token ranking
      </div>
      <div className="space-y-[10px]">
        {INTERNAL_TEAMS.map((t, i) => {
          const medal =
            i === 0 ? 'bg-[#f59e0b] text-white' :
            i === 1 ? 'bg-fg-subtle text-white' :
            i === 2 ? 'bg-[#fb923c] text-white' :
                      'bg-line-soft text-fg-muted'
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${medal}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] font-semibold text-fg">{t.name}</span>
                  <span className="font-mono text-[11px] font-bold text-fg">{t.tokens}</span>
                </div>
                <div className="mt-1 h-[6px] bg-bg rounded overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded" style={{ width: `${t.pct}%` }} />
                </div>
                <div className="font-mono text-[10px] text-[#047857] mt-[3px]">
                  saved {t.savedCost}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function DeptDemandPanel() {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            Demand · departmental attribution
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            MTD · internal cost allocation (complement to external contracts)
          </div>
        </div>
        <div className="text-[11px] text-fg-muted">
          total <span className="font-mono font-bold text-fg">43.0M</span>
        </div>
      </div>
      <div className="space-y-2">
        {DEPT_DEMAND.map((d, i) => (
          <div key={i} className="flex items-center gap-3 text-[11.5px]">
            <div className="w-32 text-fg font-medium">{d.name}</div>
            <div className="flex-1 h-2 bg-bg rounded overflow-hidden">
              <div className={`h-full rounded ${d.bar}`} style={{ width: `${d.pct}%` }} />
            </div>
            <div className="w-14 text-right font-mono font-bold text-fg">{d.tokens}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───── FinOps ────────────────────────────────────────────────────────────── */

function FinOpsCardView({ card }: { card: FinOpsCard }) {
  return (
    <div className="bg-card border border-line rounded-[10px] p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
        {card.label}
      </div>
      <div className={`font-mono text-[20px] font-bold mt-1 leading-none ${FINOPS_TONE[card.tone]}`}>
        {card.value}
      </div>
      <div className="font-mono text-[10px] mt-1 text-fg-muted">{card.meta}</div>
    </div>
  )
}

function ThreeLineChart() {
  const W = 820, H = 240, PAD_L = 36, PAD_R = 18, PAD_T = 12, PAD_B = 24
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B
  const max = 5, min = -1
  const x = (i: number) => PAD_L + (i / 23) * plotW
  const y = (v: number) => PAD_T + plotH - ((v - min) / (max - min)) * plotH
  const line = (arr: number[]) => arr.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <section className="bg-card border border-line rounded-[12px] p-4 h-full">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            3-line · heartbeat
          </div>
          <div className="flex items-baseline gap-2 mt-[2px]">
            <span className="text-[11px] text-fg-muted">Second-level ±5%</span>
            <span className="text-[10px] text-fg-subtle">·</span>
            <span className="text-[11px] text-fg-muted">past 24h</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] flex-wrap">
          <Legend dotClass="bg-[#10b981]" label="Revenue" value="3.42" />
          <Legend dotClass="bg-[#f43f5e]" label="Cost" value="2.61" />
          <Legend dotClass="bg-[#8b5cf6]" label="Margin" value="0.81 (23.7%)" />
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
        {[0, 1, 2, 3, 4, 5].map((t) => (
          <g key={t}>
            <line x1={PAD_L} y1={y(t)} x2={W - PAD_R} y2={y(t)} stroke="#f1f5f9" strokeWidth="1" />
            <text x={PAD_L - 4} y={y(t) + 3} textAnchor="end" className="text-[9px] fill-[#94a3b8] font-mono">
              {t}
            </text>
          </g>
        ))}
        <line x1={PAD_L} y1={y(0)} x2={W - PAD_R} y2={y(0)} stroke="#cbd5e1" strokeWidth="1" />
        {HOURLY.hours.filter((h) => h % 2 === 0).map((h) => (
          <text
            key={h}
            x={x(h)}
            y={H - PAD_B + 14}
            textAnchor="middle"
            className="text-[9px] fill-[#94a3b8] font-mono"
          >
            {String(h).padStart(2, '0')}
          </text>
        ))}
        <polyline fill="none" stroke="#10b981" strokeWidth="1.6" points={line(HOURLY.revenue)} />
        <polyline fill="none" stroke="#f43f5e" strokeWidth="1.6" points={line(HOURLY.cost)} />
        <polyline fill="none" stroke="#8b5cf6" strokeWidth="1.6" points={line(HOURLY.margin)} />
        <g>
          <line
            x1={x(HOURLY.alertHour)}
            y1={PAD_T}
            x2={x(HOURLY.alertHour)}
            y2={H - PAD_B}
            stroke="#dc2626"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle cx={x(HOURLY.alertHour)} cy={y(HOURLY.margin[HOURLY.alertHour])} r="5" fill="#dc2626">
            <animate attributeName="r" values="5;8;5" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
        <text x={6} y={PAD_T + 10} className="text-[9px] fill-[#94a3b8] font-mono">
          ¥/1M
        </text>
      </svg>
      <div className="mt-2 flex items-center gap-2 text-[11px] bg-[#fee2e2] border border-[#fecaca] rounded p-2 flex-wrap">
        <span className="text-[#b91c1c]">⚠</span>
        <span className="font-mono font-bold text-[#b91c1c]">{HOURLY.alertHourLabel}</span>
        <span className="text-[#b91c1c]">{HOURLY.alertMsg}</span>
        <div className="flex-1 min-w-[10px]" />
        <button className="text-[10px] px-2 py-[2px] bg-card hover:bg-line-soft border border-[#fecaca] text-[#b91c1c] rounded font-medium">
          View
        </button>
        <button className="text-[10px] px-2 py-[2px] bg-[#ef4444] hover:bg-[#b91c1c] text-white rounded font-bold">
          One-click throttle
        </button>
      </div>
    </section>
  )
}

function Legend({ dotClass, label, value }: { dotClass: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-[6px]">
      <span className={`w-[10px] h-[2px] ${dotClass}`} />
      <span className="text-fg-muted">{label}</span>
      <span className="font-mono font-bold text-fg">{value}</span>
    </div>
  )
}

function WaterfallChart() {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4 h-full">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            Margin waterfall
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            Minute-level ±10% · click any segment to drill down
          </div>
        </div>
        <div className="text-[11px]">
          <span className="text-fg-muted">Margin rate</span>
          <span className="ml-1 font-mono font-bold text-[#047857]">47.1%</span>
        </div>
      </div>
      <div className="space-y-[7px]">
        {WATERFALL.map((seg, i) => {
          const absVal = Math.abs(seg.value)
          const widthPct = (absVal / 8.32) * 100
          const color =
            seg.type === 'in'  ? 'bg-[#10b981]' :
            seg.type === 'out' ? 'bg-[#f43f5e]' : 'bg-accent'
          return (
            <button
              key={i}
              className="w-full flex items-center gap-2 text-left hover:bg-line-soft rounded px-1 py-[2px] transition-colors"
            >
              <div className="w-32 text-[11px] text-fg">{seg.name}</div>
              <div className="flex-1 h-5 bg-bg rounded relative overflow-hidden">
                <div className={`h-full rounded ${color}`} style={{ width: `${widthPct}%` }} />
                <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono font-bold text-white">
                  {seg.value > 0
                    ? `¥${seg.value.toFixed(2)}B`
                    : `−¥${Math.abs(seg.value).toFixed(2)}B`}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function RoiList() {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4 h-full">
      <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold mb-1">
        ROI leaderboard
      </div>
      <div className="text-[11px] text-fg-muted mb-3">
        ±15-20% · shaded = confidence band
      </div>

      <div className="font-mono text-[10px] uppercase tracking-wider text-[#b45309] font-bold mb-[6px]">
        Top 5 gold · profit per GPU·sec
      </div>
      <div className="space-y-1 mb-4">
        {ROI_GOLD.map((r) => (
          <div key={r.rank} className="flex items-center gap-2 text-[11px] hover:bg-[#fef3c7] rounded px-1 py-[2px] transition-colors">
            <span className="font-mono text-fg-subtle w-3">{r.rank}.</span>
            <span className="font-mono text-fg-muted w-14">{r.model}</span>
            <span className="text-fg-subtle">×</span>
            <span className="text-fg flex-1 truncate">{r.tenant}</span>
            <span className="font-mono font-bold text-[#047857]">¥{r.profit?.toFixed(2)}/s</span>
          </div>
        ))}
      </div>

      <div className="font-mono text-[10px] uppercase tracking-wider text-[#b91c1c] font-bold mb-[6px]">
        Top 3 bleeding · instant loss
      </div>
      <div className="space-y-1">
        {ROI_BLEED.map((r) => (
          <div
            key={r.rank}
            className={`flex items-center gap-2 rounded px-1 py-[2px] text-[11px] transition-colors ${r.severe ? 'bg-[#fee2e2]' : 'hover:bg-[#fee2e2]'}`}
          >
            <span className="font-mono text-fg-subtle w-3">{r.rank}.</span>
            <span className="font-mono text-fg-muted w-14">{r.model}</span>
            <span className="text-fg-subtle">×</span>
            <span className="text-fg flex-1 truncate">{r.tenant}</span>
            <span className="font-mono font-bold text-[#b91c1c]">−¥{r.loss?.toFixed(2)}/s</span>
            {r.severe && <span className="text-[#b91c1c]">⚠</span>}
          </div>
        ))}
      </div>
    </section>
  )
}

function SupplyView() {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            Model supply · upstream raw × daily consumption
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            In-house inventory + proxy quotas + failover history + daily token burn
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[880px] space-y-1">
          {SUPPLY.map((s) => {
            const ok = s.status === 'ok'
            const warn = s.status === 'warn'
            const color = ok ? 'text-[#047857]' : warn ? 'text-[#b45309]' : 'text-[#b91c1c]'
            const icon = ok ? '✓' : warn ? '⚠' : '✗'
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 text-[11px] py-[6px] border-b border-line-soft last:border-0"
              >
                <span className={`text-[14px] w-4 ${color}`}>{icon}</span>
                <span className="font-mono font-semibold text-fg w-36">{s.name}</span>
                <span className="text-fg-muted w-16">{s.origin}</span>
                <span className="text-fg-muted w-36 truncate">{s.license}</span>
                <span className="text-fg flex-1 font-mono truncate">{s.stock}</span>
                <span className="font-mono font-bold text-[#047857] w-16 text-right">
                  {MODEL_CONSUMPTION[s.id]}
                </span>
                {s.usePct > 0 && (
                  <div className="w-20 h-2 bg-bg rounded">
                    <div
                      className={`h-full rounded ${s.usePct > 70 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'}`}
                      style={{ width: `${s.usePct}%` }}
                    />
                  </div>
                )}
                <span className={`text-[10.5px] ${color} font-medium w-40 text-right`}>
                  {s.note}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function WhatIfPanel({
  pricing,
  setPricing,
  qPrice,
  setQPrice,
  lQuota,
  setLQuota,
  ladder,
  setLadder,
  whatIf,
}: {
  pricing: number
  setPricing: (n: number) => void
  qPrice: number
  setQPrice: (n: number) => void
  lQuota: number
  setLQuota: (n: number) => void
  ladder: boolean
  setLadder: (b: boolean) => void
  whatIf: { newRate: string; delta: string; monthGain: string; atRisk: number }
}) {
  return (
    <section className="bg-gradient-to-br from-accent-ultra to-card border border-accent/20 rounded-[12px] p-4 h-full">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-accent font-bold">
            What-If simulator
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            Drag · live recompute · (?) reveals confidence
          </div>
        </div>
        <div className="text-[11px] text-fg-muted">Context: Nebula Bank</div>
      </div>
      <div className="space-y-3 mb-4">
        <SliderRow label="[Nebula] pricing" value={pricing} setValue={setPricing} min={-10} max={20} suffix="%" />
        <SliderRow label="[Q-14B] unit"     value={qPrice}  setValue={setQPrice}  min={-10} max={10} suffix="%" />
        <SliderRow label="[L-70B] quota"    value={lQuota}  setValue={setLQuota}  min={-20} max={50} suffix="%" />
        <div className="flex items-center gap-3">
          <div className="w-40 text-[11px] text-fg">[long ctx] tiered pricing</div>
          <button
            onClick={() => setLadder(!ladder)}
            className={`w-9 h-5 rounded-full relative transition-colors ${ladder ? 'bg-accent' : 'bg-fg-subtle'}`}
          >
            <span
              className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow transition-all ${ladder ? 'left-[18px]' : 'left-[2px]'}`}
            />
          </button>
          <span className="text-[11px] text-fg-muted font-mono">{ladder ? 'on' : 'off'}</span>
        </div>
      </div>
      <div className="bg-card border border-line rounded-[10px] p-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-bold mb-2">
          Forecast
        </div>
        <div className="space-y-[7px] text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-fg-muted">Overall margin rate</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-fg-muted">23.7%</span>
              <span className="text-fg-subtle">→</span>
              <span className="font-mono font-bold text-[#047857]">{whatIf.newRate}%</span>
              <span className="text-[#047857] text-[10px]">
                ({parseFloat(whatIf.delta) > 0 ? '+' : ''}
                {whatIf.delta}pt)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-fg-muted">Monthly margin</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-fg-muted">¥3.92B</span>
              <span className="text-fg-subtle">→</span>
              <span className="font-mono font-bold text-[#047857]">
                ¥{(3.92 + parseFloat(whatIf.monthGain)).toFixed(2)}B
              </span>
              <span className="text-[#047857] text-[10px]">(+¥{whatIf.monthGain}B)</span>
            </div>
          </div>
          {whatIf.atRisk > 0 && (
            <div className="flex items-center justify-between text-[#b45309] bg-[#fef3c7] -mx-1 px-1 py-1 rounded">
              <span>At-risk customers</span>
              <span className="font-mono font-semibold">
                +{whatIf.atRisk} possible churn (Nebula, SaaS X…)
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button className="text-[11px] px-3 py-[6px] bg-card hover:bg-line-soft border border-line text-fg rounded-[6px]">
          ↺ Reset
        </button>
        <button className="text-[11px] px-3 py-[6px] bg-card hover:bg-line-soft border border-line text-fg rounded-[6px]">
          Save draft
        </button>
        <button className="text-[11px] px-3 py-[6px] bg-accent hover:bg-[#1d4ed8] text-white font-bold rounded-[6px]">
          → Push to command
        </button>
      </div>
    </section>
  )
}

function SliderRow({
  label,
  value,
  setValue,
  min,
  max,
  suffix,
}: {
  label: string
  value: number
  setValue: (n: number) => void
  min: number
  max: number
  suffix: string
}) {
  const sign = value > 0 ? '+' : ''
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 text-[11px] text-fg">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10))}
        className="flex-1 accent-accent"
      />
      <div className="w-14 text-right text-[11px] font-mono font-bold text-accent">
        {sign}
        {value}
        {suffix}
      </div>
    </div>
  )
}

/* ───── Factory / command ─────────────────────────────────────────────────── */

function ClusterOverview() {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4 h-full">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            Factory health · cluster overview
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            GPU topology / traces / hardware alerts owned by LLM base
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CLUSTER_OVERVIEW.map((s, i) => (
          <div key={i} className="bg-bg border border-line rounded-[9px] p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
              {s.label}
            </div>
            <div className={`font-mono text-[18px] font-bold mt-1 leading-none ${CLUSTER_TONE[s.tone]}`}>
              {s.value}
            </div>
            <div className="font-mono text-[10px] mt-1 text-fg-muted">{s.meta}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function FactoryAlerts() {
  return (
    <section className="bg-card border border-line rounded-[12px] h-full">
      <div className="px-4 py-[10px] border-b border-line flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            Factory alerts
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            Hardware / model / capacity · parallel to audit stream
          </div>
        </div>
        <div className="font-mono text-[11px] text-fg-subtle">
          {FACTORY_ALERTS.length} open
        </div>
      </div>
      <div className="divide-y divide-line-soft">
        {FACTORY_ALERTS.map((a, i) => (
          <div
            key={i}
            className={`px-4 py-[10px] flex items-center gap-3 border-l-4 ${ALERT_BORDER[a.level]}`}
          >
            <div className={`w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold shrink-0 ${ALERT_CHIP[a.level]}`}>
              {ALERT_ICON_CHAR[a.level]}
            </div>
            <div className="flex-1 min-w-0 text-[12px] text-fg truncate">{a.title}</div>
            <div className="font-mono text-[10px] text-fg-subtle shrink-0">{a.time}</div>
            {a.jumpCard && (
              <button className="text-[10px] px-2 py-[2px] bg-[#fee2e2] hover:bg-[#fecaca] border border-[#fecaca] text-[#b91c1c] rounded font-medium shrink-0">
                Jump to source →
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function WarRoom({ policies, onRevoke }: { policies: Policy[]; onRevoke: (id: string) => void }) {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
            Active policies · non-default
          </div>
          <div className="text-[11.5px] text-fg-muted mt-[2px]">
            Always visible · default eye-landing zone
          </div>
        </div>
        <div className="text-[11px]">
          <span className="text-fg-subtle">active</span>{' '}
          <span className="font-mono font-bold text-accent">{policies.length}</span>
        </div>
      </div>
      <div className="space-y-1">
        {policies.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 text-[11px] py-[7px] border-b border-line-soft last:border-0 flex-wrap"
          >
            <span className="font-mono text-fg-subtle">⏱ {p.age}</span>
            <span className="font-semibold text-fg flex-1 min-w-[140px]">{p.label}</span>
            {p.expires && <span className="text-[10px] text-fg-muted">expires {p.expires}</span>}
            {p.tag && (
              <span className="text-[10px] px-[6px] py-[1px] bg-[#fef3c7] text-[#b45309] border border-[#fde68a] rounded">
                {p.tag}
              </span>
            )}
            <span className={`text-[10px] ${p.auto ? 'text-accent' : 'text-fg-muted'}`}>by {p.by}</span>
            <button className="text-[10px] px-2 py-[2px] bg-line-soft hover:bg-line text-fg rounded">
              Details
            </button>
            <button
              onClick={() => onRevoke(p.id)}
              className="text-[10px] px-2 py-[2px] bg-card border border-line hover:bg-[#fee2e2] hover:border-[#fecaca] hover:text-[#b91c1c] rounded"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function LeversPanel({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <section className="bg-card border border-line rounded-[12px] p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold mb-3">
        Levers
      </div>
      <div className="space-y-[6px]">
        {LEVERS.map((l) => {
          const active = selected === l.id
          return (
            <button
              key={l.id}
              onClick={() => onSelect(active ? null : l.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[9px] border text-left transition-colors ${
                active
                  ? 'bg-accent-ultra border-accent/30 text-fg'
                  : 'bg-card border-line hover:border-accent/20 text-fg-muted'
              }`}
            >
              <span className="text-[16px] w-5">{l.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-fg">{l.label}</div>
                <div className="font-mono text-[10px] text-fg-subtle">{l.actions}</div>
              </div>
              {active && <span className="text-accent">←</span>}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="mt-3 pt-3 border-t border-line-soft">
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-bold mb-2">
            ▼ selected: {LEVERS.find((l) => l.id === selected)?.label}
          </div>
          <div className="text-[11px] text-fg-muted italic">
            Prototype — inline lever control not wired
          </div>
        </div>
      )}
    </section>
  )
}

function ImpactPreview({
  reason,
  onReasonChange,
  onExecute,
}: {
  reason: string
  onReasonChange: (r: string) => void
  onExecute: () => void
}) {
  const canExecute = reason.trim().length > 0
  return (
    <section className="bg-card border border-line rounded-[12px] p-4">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-accent font-bold">
            🎯 Current draft
          </div>
          <div className="text-[14px] font-bold text-fg mt-[2px]">Nebula Bank · expand capacity</div>
        </div>
        <div className="text-[10px] text-fg-subtle">takes effect in 30s</div>
      </div>
      <div className="bg-bg border border-line rounded-[9px] p-3 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-fg-muted font-bold mb-2">
          Impact radius
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <ImpactCell label="Tenants" value="12" />
          <ImpactCell label="Tokens/h" value="420M" />
          <ImpactCell label="SLA contracts" value="2 hard constraints" />
          <ImpactCell label="VIPs" value="3 (Nebula included)" />
        </div>
      </div>
      <div className="bg-[#d1fae5] border border-[#a7f3d0] rounded-[9px] p-3 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#047857] font-bold mb-2">
          📈 Forecast economic impact
        </div>
        <div className="space-y-[6px] text-[11px]">
          <div className="flex justify-between">
            <span className="text-fg-muted">Margin rate</span>
            <span className="font-mono">
              23.7% → <span className="font-bold text-[#047857]">25.3%</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">Monthly margin</span>
            <span className="font-mono font-bold text-[#047857]">+¥0.26B</span>
          </div>
          <div className="flex justify-between text-[10px] text-[#047857]">
            <span>Confidence interval</span>
            <span className="font-mono">±0.6pt</span>
          </div>
        </div>
      </div>
      <div className="bg-[#fef3c7] border border-[#fde68a] rounded-[9px] p-3 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#b45309] font-bold mb-[6px]">
          ⚠ Risks
        </div>
        <ul className="text-[11px] text-[#b45309] space-y-[2px] list-disc ml-4">
          <li>Pufa SLA hard constraint</li>
          <li>Last canary was 3h ago, recommend ≥ 4h</li>
          <li>
            Historical success rate <span className="font-mono font-bold">94%</span>
          </li>
        </ul>
      </div>
      <div className="mb-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-fg-muted font-bold mb-[4px]">
          📝 Reason (required)
        </div>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Why is this change happening?"
          className="w-full text-[11px] font-mono bg-bg border border-line rounded p-2 focus:outline-none focus:border-accent resize-none"
        />
        {!reason.trim() && (
          <div className="text-[10px] text-[#b91c1c] mt-1">⚠ Reason required before execution</div>
        )}
      </div>
      <div className="flex gap-2">
        <button className="flex-1 text-[11px] px-3 py-2 bg-card hover:bg-line-soft border border-line text-fg rounded font-medium">
          Dry-run
        </button>
        <button className="flex-1 text-[11px] px-3 py-2 bg-card hover:bg-line-soft border border-line text-fg rounded font-medium">
          Simulate 2s
        </button>
        <button
          onClick={onExecute}
          disabled={!canExecute}
          className={`flex-1 text-[11px] px-3 py-2 rounded font-bold ${
            canExecute
              ? 'bg-[#ef4444] hover:bg-[#b91c1c] text-white shadow-sm'
              : 'bg-line-soft text-fg-subtle cursor-not-allowed'
          }`}
        >
          Execute
        </button>
      </div>
    </section>
  )
}

function ImpactCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-fg-subtle">{label}</div>
      <div className="font-mono font-bold text-fg">{value}</div>
    </div>
  )
}

function AuditFeed({ audit }: { audit: AuditRow[] }) {
  return (
    <section className="bg-card border border-line rounded-[12px]">
      <div className="px-4 py-[10px] border-b border-line">
        <div className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
          Live audit stream · global canonical
        </div>
        <div className="text-[11.5px] text-fg-muted mt-[2px]">
          Cockpit and LLM base share one stream · compliant reconciliation
        </div>
      </div>
      <div className="divide-y divide-line-soft">
        {audit.map((a, i) => (
          <div key={i} className="px-4 py-2 flex items-center gap-3 text-[11px] flex-wrap">
            <span className="font-mono text-fg-subtle w-12">{a.time}</span>
            <span
              className={`font-semibold w-16 ${a.who === 'System' ? 'text-accent' : 'text-fg'}`}
            >
              {a.who}
            </span>
            <span className="text-fg flex-1 font-mono min-w-[160px]">{a.what}</span>
            <span className="text-[10px] text-fg-muted w-24">{a.impact}</span>
            <span className={`text-[10px] ${a.ok ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>
              {a.ok ? '✓' : '✗'}
            </span>
            {a.rollback && (
              <button className="text-[10px] px-2 py-[2px] bg-line-soft hover:bg-line text-fg rounded">
                Rollback
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
