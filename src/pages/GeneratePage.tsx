import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Sparkles,
  Shield,
  ShieldCheck,
  FileCode2,
  FlaskConical,
  Rocket,
  ScrollText,
  ArrowRight,
  Lock,
} from 'lucide-react'

/* ============================================================================
 * Stage pipeline
 * ========================================================================= */

type Stage = 'parse' | 'scope' | 'generate' | 'scan' | 'policy' | 'sandbox' | 'deploy'

const STAGES: Stage[] = ['parse', 'scope', 'generate', 'scan', 'policy', 'sandbox', 'deploy']

const STAGE_INFO: Record<
  Stage,
  { title: string; kicker: string; Icon: typeof Sparkles; tone: string }
> = {
  parse: { title: 'Parse', kicker: 'Intent', Icon: Sparkles, tone: 'Understand what user asked' },
  scope: { title: 'Scope', kicker: 'Permissions', Icon: Lock, tone: 'Minimal-privilege resolution' },
  generate: { title: 'Generate', kicker: 'Code', Icon: FileCode2, tone: 'Write handler + manifest' },
  scan: { title: 'Scan', kicker: 'Security', Icon: Shield, tone: 'SAST + dependency audit' },
  policy: { title: 'Policy', kicker: 'Governance', Icon: ScrollText, tone: 'Data / cost / compliance' },
  sandbox: { title: 'Sandbox', kicker: 'Dry-run', Icon: FlaskConical, tone: 'Isolated execution probe' },
  deploy: { title: 'Deploy', kicker: 'Release', Icon: Rocket, tone: 'Build · sign · publish · audit' },
}

/* ============================================================================
 * Timing plan (milliseconds from start)
 * ========================================================================= */

const STAGE_TIMING: Record<Stage, number> = {
  parse: 0,
  scope: 900,
  generate: 1900,
  scan: 4100,
  policy: 5400,
  sandbox: 6600,
  deploy: 8300,
}
const FINISH_AT = 9600

export default function GeneratePage() {
  const [params] = useSearchParams()
  const prompt = params.get('q') || ''
  const navigate = useNavigate()

  const [stage, setStage] = useState<Stage>('parse')
  const [finished, setFinished] = useState(false)
  const [activeTab, setActiveTab] = useState<Stage>('parse')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    STAGES.forEach((s) => {
      timers.push(
        setTimeout(() => {
          setStage(s)
          setActiveTab(s)
        }, STAGE_TIMING[s]),
      )
    })
    timers.push(setTimeout(() => setFinished(true), FINISH_AT))
    return () => timers.forEach(clearTimeout)
  }, [])

  const currentIdx = useMemo(() => STAGES.indexOf(stage), [stage])

  const tabUnlocked = (s: Stage) => STAGES.indexOf(s) <= currentIdx

  return (
    <div className="min-h-full p-8">
      <div className="max-w-[1180px] mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium transition-colors"
        >
          ← Back to Home
        </button>

        <div className="mb-5">
          <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-2">
            Prompt
          </div>
          <div className="text-[19px] font-medium text-fg leading-snug max-w-[860px]">
            &ldquo;{prompt || 'Weekly platform team alert dashboard, push to Feishu every Monday 9am'}&rdquo;
          </div>
        </div>

        {/* Horizontal pipeline */}
        <div className="bg-card border border-line rounded-[12px] px-4 py-3 mb-5 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-[6px] min-w-max">
            {STAGES.map((s, i) => {
              const done = i < currentIdx || (i === currentIdx && finished)
              const active = i === currentIdx && !finished
              const Info = STAGE_INFO[s]
              const Icon = Info.Icon
              return (
                <div key={s} className="flex items-center">
                  <motion.button
                    onClick={() => tabUnlocked(s) && setActiveTab(s)}
                    disabled={!tabUnlocked(s)}
                    animate={{
                      backgroundColor: done ? '#eff6ff' : active ? '#2563eb' : '#ffffff',
                      borderColor: done ? '#bfdbfe' : active ? '#2563eb' : '#e7e7e7',
                      color: done ? '#2563eb' : active ? '#ffffff' : '#a3a3a3',
                    }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-[7px] px-[11px] py-[7px] rounded-[9px] text-[12px] font-semibold border ${
                      tabUnlocked(s) ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'
                    } ${activeTab === s ? 'ring-2 ring-accent/30' : ''}`}
                  >
                    {done ? (
                      <Check size={12} strokeWidth={3} />
                    ) : active ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                        className="inline-flex"
                      >
                        <Icon size={12} />
                      </motion.span>
                    ) : (
                      <Icon size={12} />
                    )}
                    {Info.title}
                  </motion.button>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`w-4 h-px mx-[2px] transition-colors ${
                        i < currentIdx ? 'bg-accent' : 'bg-line'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main split */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '360px 1fr' }}>
          {/* Left: narrative timeline */}
          <div className="bg-card border border-line rounded-[12px] p-5">
            <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-wider mb-4">
              DevOps Timeline
            </div>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-line" />
              <div className="space-y-[14px]">
                {STAGES.map((s, i) => {
                  const done = i < currentIdx || (i === currentIdx && finished)
                  const active = i === currentIdx && !finished
                  const upcoming = i > currentIdx
                  return (
                    <TimelineItem
                      key={s}
                      stage={s}
                      done={done}
                      active={active}
                      upcoming={upcoming}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: artifact terminal */}
          <div className="bg-[#0a0a0a] rounded-[12px] overflow-hidden flex flex-col" style={{ minHeight: 520 }}>
            <div className="flex items-center gap-[2px] px-3 pt-3 pb-0 border-b border-white/10 overflow-x-auto scrollbar-thin">
              {STAGES.map((s) => {
                const unlocked = tabUnlocked(s)
                const current = activeTab === s
                const Info = STAGE_INFO[s]
                return (
                  <button
                    key={s}
                    onClick={() => unlocked && setActiveTab(s)}
                    disabled={!unlocked}
                    className={`px-[11px] py-2 rounded-t-[7px] text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-[6px] transition-colors ${
                      current
                        ? 'bg-[#1a1a1a] text-white'
                        : unlocked
                          ? 'text-white/50 hover:text-white/80'
                          : 'text-white/20 cursor-not-allowed'
                    }`}
                  >
                    {Info.kicker}
                    {unlocked && !current && s === stage && (
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-[5px] h-[5px] rounded-full bg-accent"
                      />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex-1 p-5 font-mono text-[12px] text-white/85 overflow-y-auto scrollbar-thin">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                <ArtifactContent stage={activeTab} currentStage={stage} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Deploy action */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 bg-card border border-accent/30 rounded-[12px] p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d1fae5] flex items-center justify-center">
                  <ShieldCheck size={18} className="text-[#10b981]" />
                </div>
                <div>
                  <div className="font-bold text-fg text-[15px]">
                    Deployed · signed · audited
                  </div>
                  <div className="font-mono text-[11px] text-fg-subtle mt-[2px]">
                    build:8f3a2e1 · identity:invoker · namespace:apps/platform · audit:on
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/apps/team-alert-dashboard')}
                className="px-5 py-[11px] bg-accent text-white rounded-[10px] font-semibold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors shrink-0"
              >
                Open App <ArrowRight size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ============================================================================
 * Timeline item
 * ========================================================================= */

function TimelineItem({
  stage,
  done,
  active,
  upcoming,
}: {
  stage: Stage
  done: boolean
  active: boolean
  upcoming: boolean
}) {
  const Info = STAGE_INFO[stage]
  const Icon = Info.Icon
  return (
    <div className="relative pl-[34px]">
      <motion.div
        animate={{
          backgroundColor: done ? '#2563eb' : active ? '#ffffff' : '#ffffff',
          borderColor: done ? '#2563eb' : active ? '#2563eb' : '#e7e7e7',
        }}
        className="absolute left-0 top-[1px] w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center z-10"
      >
        {done ? (
          <Check size={11} strokeWidth={3} className="text-white" />
        ) : active ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          >
            <Icon size={10} className="text-accent" />
          </motion.span>
        ) : (
          <Icon size={10} className="text-fg-subtle" />
        )}
      </motion.div>
      <div
        className={`text-[13px] font-bold leading-tight ${
          upcoming ? 'text-fg-subtle' : 'text-fg'
        }`}
      >
        {Info.title}
        <span className="font-mono font-semibold text-[10px] text-fg-subtle ml-2 uppercase tracking-wider">
          · {Info.kicker}
        </span>
      </div>
      <AnimatePresence>
        {(active || done) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="text-[11.5px] text-fg-muted leading-[1.55] mt-[4px] pr-2">
              {stageNarrative(stage, active)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {upcoming && (
        <div className="text-[11px] text-fg-subtle mt-[2px]">{Info.tone}</div>
      )}
    </div>
  )
}

function stageNarrative(stage: Stage, active: boolean): string {
  const suffix = active ? '...' : ''
  switch (stage) {
    case 'parse':
      return `Weekly cadence dashboard${active ? ' being analyzed' : ' detected'}${suffix} Pulled intent: platform alerts + pod health, delivered via Feishu.`
    case 'scope':
      return `Resolved minimum-privilege set${suffix} 4 capabilities granted, 2 denied (dce:secrets:read, dce:nodes:write out of scope).`
    case 'generate':
      return `handler.ts + manifest.yaml generated${suffix} 47 lines handler, pinned runtime identity = invoker.`
    case 'scan':
      return `SAST + dependency audit${suffix} 0 critical, 0 high, 1 low advisory (rate-limit guard suggested).`
    case 'policy':
      return `Data sensitivity: low · retention: none · cost: $0.16/mo · within team budget · no cross-namespace egress${suffix}`
    case 'sandbox':
      return `Dry-run in isolated sandbox${suffix} Pulled 47 alerts, rendered template in 1.2s, output hash verified.`
    case 'deploy':
      return `Artifact built & signed${suffix} Published to apps/platform namespace, audit stream enabled, rollback point captured.`
  }
}

/* ============================================================================
 * Artifact content per stage
 * ========================================================================= */

function ArtifactContent({ stage, currentStage }: { stage: Stage; currentStage: Stage }) {
  const isLive = stage === currentStage
  switch (stage) {
    case 'parse':
      return <IntentArtifact live={isLive} />
    case 'scope':
      return <ScopeArtifact live={isLive} />
    case 'generate':
      return <CodeArtifact live={isLive} />
    case 'scan':
      return <ScanArtifact live={isLive} />
    case 'policy':
      return <PolicyArtifact live={isLive} />
    case 'sandbox':
      return <SandboxArtifact live={isLive} />
    case 'deploy':
      return <DeployArtifact live={isLive} />
  }
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-white/40 text-[10px] mb-3 uppercase tracking-wider font-semibold">
      <span>{icon}</span> {label}
    </div>
  )
}

function IntentArtifact({ live }: { live: boolean }) {
  const lines = [
    '{',
    '  "task_type": "scheduled_dashboard",',
    '  "subject": "platform_team_alerts",',
    '  "signals": ["alerts", "pod_health"],',
    '  "cadence": { "cron": "0 9 * * MON", "tz": "Asia/Shanghai" },',
    '  "output": { "format": "dashboard", "delivery": ["feishu"] },',
    '  "scope": "team:platform",',
    '  "confidence": 0.94',
    '}',
  ]
  return (
    <>
      <SectionHeader icon="◆" label="Parsed Intent" />
      <Stream lines={lines} live={live} color="text-white" />
    </>
  )
}

function ScopeArtifact({ live }: { live: boolean }) {
  const allowed = [
    { cap: 'dce:alerts:read', reason: 'needed for top-N alert fetch' },
    { cap: 'dce:pods:read', reason: 'needed for health snapshot' },
    { cap: 'dce:teams:read', reason: 'needed for team resolution' },
    { cap: 'feishu:messages:send', reason: 'needed for delivery' },
  ]
  const denied = [
    { cap: 'dce:secrets:read', reason: 'not required by intent' },
    { cap: 'dce:nodes:write', reason: 'read-only task' },
  ]
  return (
    <>
      <SectionHeader icon="🔐" label="Minimum Privilege Resolution" />
      <div className="space-y-1 mb-4">
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Granted</div>
        {allowed.map((a, i) => (
          <StreamRow key={i} live={live} delay={i * 80}>
            <span className="text-[#10b981]">+</span>{' '}
            <span className="text-white">{a.cap.padEnd(26)}</span>
            <span className="text-white/40">// {a.reason}</span>
          </StreamRow>
        ))}
      </div>
      <div className="space-y-1">
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Denied (out of scope)</div>
        {denied.map((a, i) => (
          <StreamRow key={i} live={live} delay={(allowed.length + i) * 80}>
            <span className="text-[#ef4444]">-</span>{' '}
            <span className="text-white/60">{a.cap.padEnd(26)}</span>
            <span className="text-white/40">// {a.reason}</span>
          </StreamRow>
        ))}
      </div>
    </>
  )
}

function CodeArtifact({ live }: { live: boolean }) {
  const lines = [
    '# manifest.yaml',
    'app: team-alert-dashboard',
    'version: v1.0',
    'runtime_identity: invoker',
    'capabilities:',
    '  - dce:alerts:read',
    '  - dce:pods:read',
    '  - dce:teams:read',
    '  - feishu:messages:send',
    "schedule: '0 9 * * MON'",
    'data_retention: none',
    '',
    '# handler.ts',
    'export async function run(ctx) {',
    "  const alerts = await ctx.cli('dce.alerts.list', {",
    "    team: 'platform',",
    "    since: '7d',",
    '    top: 10,',
    '  })',
    '',
    "  const pods = await ctx.cli('dce.pods.health', {",
    "    namespace: 'platform',",
    '  })',
    '',
    "  return ctx.render('team-alert.template', {",
    '    alerts,',
    '    pods,',
    '    generatedAt: new Date(),',
    '  })',
    '}',
  ]
  return (
    <>
      <SectionHeader icon="</>" label="Generated Source" />
      <Stream lines={lines} live={live} color="text-white" commentColor="text-white/45" />
    </>
  )
}

function ScanArtifact({ live }: { live: boolean }) {
  const checks = [
    { label: 'Static analysis (SAST)', result: 'pass', detail: '0 critical, 0 high' },
    { label: 'Secret detection', result: 'pass', detail: 'no hardcoded credentials' },
    { label: 'Dangerous API audit', result: 'pass', detail: 'no eval / exec / fs.write' },
    { label: 'Dependency vulnerability', result: 'pass', detail: '24 deps checked, CVE db synced 2h ago' },
    { label: 'Network egress audit', result: 'pass', detail: 'only whitelisted domains' },
    { label: 'Rate-limit guard', result: 'warn', detail: 'low: missing explicit throttle on dce.alerts.list' },
  ]
  return (
    <>
      <SectionHeader icon="🛡" label="Security Scan Report" />
      <div className="space-y-[6px]">
        {checks.map((c, i) => (
          <StreamRow key={i} live={live} delay={i * 120}>
            {c.result === 'pass' ? (
              <span className="text-[#10b981]">✓</span>
            ) : (
              <span className="text-[#f59e0b]">⚠</span>
            )}{' '}
            <span className="text-white inline-block w-[200px]">{c.label}</span>
            <span className="text-white/45">{c.detail}</span>
          </StreamRow>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 text-[11px]">
        <span className="text-white/45">Summary:</span>{' '}
        <span className="text-[#10b981]">0 blocking</span>{' '}
        <span className="text-white/30">·</span>{' '}
        <span className="text-[#f59e0b]">1 low advisory</span>{' '}
        <span className="text-white/30">·</span>{' '}
        <span className="text-white/60">proceed allowed</span>
      </div>
    </>
  )
}

function PolicyArtifact({ live }: { live: boolean }) {
  const rows = [
    { k: 'data_sensitivity', v: 'low', ok: true, note: 'operational telemetry only' },
    { k: 'data_retention', v: 'none', ok: true, note: 'stream-through, no storage' },
    { k: 'cross_ns_egress', v: 'none', ok: true, note: 'bound to team:platform' },
    { k: 'pii_access', v: 'none', ok: true, note: 'no personal fields touched' },
    { k: 'cost_estimate', v: '$0.16/mo', ok: true, note: '$0.04/run × 4 runs/mo' },
    { k: 'budget_check', v: 'within', ok: true, note: 'team monthly budget: $50.00' },
    { k: 'approval_required', v: 'auto', ok: true, note: 'risk score 12/100 · below threshold 60' },
  ]
  return (
    <>
      <SectionHeader icon="§" label="Policy Check" />
      <div className="space-y-[5px]">
        {rows.map((r, i) => (
          <StreamRow key={i} live={live} delay={i * 110}>
            <span className="text-[#10b981]">✓</span>{' '}
            <span className="text-white/50 inline-block w-[160px]">{r.k}</span>
            <span className="text-white inline-block w-[100px]">{r.v}</span>
            <span className="text-white/45">{r.note}</span>
          </StreamRow>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/60">
        <span className="text-white/40">Verdict:</span>{' '}
        <span className="text-[#10b981]">policy compliant</span>{' '}
        <span className="text-white/30">·</span> auto-approval granted
      </div>
    </>
  )
}

function SandboxArtifact({ live }: { live: boolean }) {
  const logs = [
    { t: '00:00.012', tag: 'sandbox', msg: 'provisioning isolated namespace sbx-7x9q' },
    { t: '00:00.084', tag: 'sandbox', msg: 'injecting synthetic identity: invoker' },
    { t: '00:00.112', tag: 'runtime', msg: 'loading handler.ts + manifest.yaml' },
    { t: '00:00.245', tag: 'cli',     msg: "→ dce.alerts.list team=platform since=7d top=10" },
    { t: '00:00.781', tag: 'cli',     msg: '← 47 alerts returned (cached, ttl 60s)' },
    { t: '00:00.803', tag: 'cli',     msg: '→ dce.pods.health namespace=platform' },
    { t: '00:01.047', tag: 'cli',     msg: '← 8 namespaces, avg 92.3% healthy' },
    { t: '00:01.102', tag: 'render',  msg: 'template team-alert.template compiled' },
    { t: '00:01.189', tag: 'render',  msg: 'output hash sha256:f4a2b9... verified' },
    { t: '00:01.201', tag: 'result',  msg: 'exit 0 · 1.189s wall · 42MB peak mem' },
  ]
  return (
    <>
      <SectionHeader icon="⌘" label="Sandbox Dry-Run" />
      <div className="space-y-[3px]">
        {logs.map((l, i) => (
          <StreamRow key={i} live={live} delay={i * 90}>
            <span className="text-white/35">{l.t}</span>{' '}
            <span
              className={`inline-block w-[60px] ${
                l.tag === 'result'
                  ? 'text-[#10b981]'
                  : l.tag === 'cli'
                    ? 'text-accent'
                    : 'text-white/55'
              }`}
            >
              [{l.tag}]
            </span>
            <span className="text-white/85">{l.msg}</span>
          </StreamRow>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/60">
        <span className="text-[#10b981]">✓ dry-run passed</span> · output matches declared schema
      </div>
    </>
  )
}

function DeployArtifact({ live }: { live: boolean }) {
  const steps = [
    { label: 'build',    v: 'artifact:8f3a2e1 (sha256:c9...)' },
    { label: 'sign',     v: 'signed by forge-release/v2 · cosign verified' },
    { label: 'push',     v: 'registry.internal/apps/team-alert-dashboard:v1.0' },
    { label: 'identity', v: 'runtime_identity bound → invoker (per-user)' },
    { label: 'publish',  v: 'namespace apps/platform · region cn-east-1' },
    { label: 'cron',     v: 'schedule registered · next run Mon 09:00 CST' },
    { label: 'audit',    v: 'audit stream enabled → audit.forge.events' },
    { label: 'rollback', v: 'checkpoint captured · 1-click revert armed' },
  ]
  return (
    <>
      <SectionHeader icon="▲" label="Deployment Record" />
      <div className="space-y-[5px]">
        {steps.map((s, i) => (
          <StreamRow key={i} live={live} delay={i * 130}>
            <span className="text-[#10b981]">✓</span>{' '}
            <span className="text-white inline-block w-[90px] uppercase tracking-wider text-[10px] font-bold">
              {s.label}
            </span>
            <span className="text-white/75">{s.v}</span>
          </StreamRow>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] space-y-[3px]">
        <div className="text-white/60">
          <span className="text-white/40">status:</span>{' '}
          <span className="text-[#10b981] font-bold">LIVE</span>
        </div>
        <div className="text-white/40">
          deployed at 2026-04-15T14:22:08Z · audited · rollback available
        </div>
      </div>
    </>
  )
}

/* ============================================================================
 * Stream helpers — fade lines in sequentially when "live"
 * ========================================================================= */

function Stream({
  lines,
  live,
  color = 'text-white',
  commentColor = 'text-white/45',
}: {
  lines: string[]
  live: boolean
  color?: string
  commentColor?: string
}) {
  const [shown, setShown] = useState(live ? 0 : lines.length)

  useEffect(() => {
    if (!live) {
      setShown(lines.length)
      return
    }
    setShown(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    lines.forEach((_, i) => {
      timers.push(setTimeout(() => setShown(i + 1), 50 + i * 60))
    })
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live])

  return (
    <div className="space-y-[2px]">
      {lines.slice(0, shown).map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12 }}
          className={`whitespace-pre ${l.startsWith('#') ? commentColor : color}`}
        >
          {l || '\u00A0'}
        </motion.div>
      ))}
      {live && shown < lines.length && (
        <motion.span
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-[6px] h-[13px] bg-accent align-middle"
        />
      )}
    </div>
  )
}

function StreamRow({
  children,
  live,
  delay,
}: {
  children: React.ReactNode
  live: boolean
  delay: number
}) {
  const [shown, setShown] = useState(!live)
  useEffect(() => {
    if (!live) {
      setShown(true)
      return
    }
    setShown(false)
    const t = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(t)
  }, [live, delay])
  if (!shown) return null
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className="whitespace-pre-wrap"
    >
      {children}
    </motion.div>
  )
}

