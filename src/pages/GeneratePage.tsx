import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileCode2,
  FlaskConical,
  Lock,
  Rocket,
  ScrollText,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type {
  Session,
  SessionStage,
  StageArtifact,
  StageName,
} from '@/types'
import { useSession } from '@/hooks/useSessions'
import { cancelSession, confirmScope, createSession } from '@/mock/sessions'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'

const STAGES: StageName[] = [
  'parse',
  'scope',
  'generate',
  'scan',
  'policy',
  'sandbox',
  'deploy',
]

const STAGE_INFO: Record<
  StageName,
  { title: string; kicker: string; Icon: typeof Sparkles; tone: string }
> = {
  parse: {
    title: 'Parse',
    kicker: 'Intent',
    Icon: Sparkles,
    tone: 'Understand what user asked',
  },
  scope: {
    title: 'Scope',
    kicker: 'Permissions',
    Icon: Lock,
    tone: 'Minimal-privilege resolution',
  },
  generate: {
    title: 'Generate',
    kicker: 'Code',
    Icon: FileCode2,
    tone: 'Write handler + manifest',
  },
  scan: {
    title: 'Scan',
    kicker: 'Security',
    Icon: Shield,
    tone: 'SAST + dependency audit',
  },
  policy: {
    title: 'Policy',
    kicker: 'Governance',
    Icon: ScrollText,
    tone: 'Data / cost / compliance',
  },
  sandbox: {
    title: 'Sandbox',
    kicker: 'Dry-run',
    Icon: FlaskConical,
    tone: 'Isolated execution probe',
  },
  deploy: {
    title: 'Deploy',
    kicker: 'Release',
    Icon: Rocket,
    tone: 'Build · sign · publish · audit',
  },
}

export default function GeneratePage() {
  const { sessionId } = useParams<{ sessionId?: string }>()
  if (sessionId) return <SessionView sessionId={sessionId} />
  return <BootstrapFlow />
}

function BootstrapFlow() {
  const [searchParams] = useSearchParams()
  const promptRaw = searchParams.get('q') ?? ''
  const prompt = promptRaw.trim()
  const navigate = useNavigate()
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!prompt) {
      setError(new Error('Missing prompt. Launch /generate with ?q=<your idea>.'))
      return
    }
    let cancelled = false
    createSession(prompt)
      .then((s) => {
        if (!cancelled) navigate(`/generate/${s.id}`, { replace: true })
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      })
    return () => {
      cancelled = true
    }
  }, [prompt, navigate])

  return (
    <PageShell>
      {error ? (
        <ErrorState error={error} />
      ) : (
        <LoadingState label="Starting session..." />
      )}
    </PageShell>
  )
}

function SessionView({ sessionId }: { sessionId: string }) {
  const { data: session, loading, error, refresh } = useSession(sessionId, {
    pollMs: 400,
  })

  if (loading && !session) {
    return (
      <PageShell>
        <LoadingState label="Loading session..." />
      </PageShell>
    )
  }
  if (error) {
    return (
      <PageShell>
        <ErrorState error={error} onRetry={refresh} />
      </PageShell>
    )
  }
  if (!session) {
    return (
      <PageShell>
        <EmptyState
          message="Session not found"
          hint={`No session matches id "${sessionId}". It may have been cleared on reload.`}
        />
      </PageShell>
    )
  }

  return <SessionRenderer session={session} onRefresh={refresh} />
}

function PageShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-full p-8">
      <div className="max-w-[1180px] mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-fg-muted hover:text-fg text-sm mb-4 font-medium transition-colors"
        >
          ← Back to Home
        </button>
        {children}
      </div>
    </div>
  )
}

function SessionRenderer({
  session,
  onRefresh,
}: {
  session: Session
  onRefresh: () => void
}) {
  const navigate = useNavigate()
  const activeIdx = useMemo(() => computeActiveIdx(session.stages), [session.stages])
  const activeStageName = session.stages[activeIdx]?.name ?? 'parse'

  const [activeTab, setActiveTab] = useState<StageName>(activeStageName)
  useEffect(() => {
    setActiveTab(activeStageName)
  }, [activeStageName])

  const stageUnlocked = (name: StageName): boolean => {
    const stage = session.stages.find((s) => s.name === name)
    return Boolean(stage && stage.status !== 'pending')
  }

  return (
    <PageShell>
      <div className="mb-5">
        <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.12em] mb-2">
          Prompt
        </div>
        <div className="text-[19px] font-medium text-fg leading-snug max-w-[860px]">
          &ldquo;{session.prompt}&rdquo;
        </div>
        <div className="mt-2 font-mono text-[11px] text-fg-subtle">
          session: {session.id} · status: {session.status}
        </div>
      </div>

      <Pipeline
        stages={session.stages}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stageUnlocked={stageUnlocked}
      />

      <div className="grid gap-5" style={{ gridTemplateColumns: '360px 1fr' }}>
        <Timeline stages={session.stages} />
        <ArtifactTerminal
          stages={session.stages}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stageUnlocked={stageUnlocked}
        />
      </div>

      <AnimatePresence>
        {session.status === 'awaiting-confirm' && (
          <ConfirmScopePanel
            sessionId={session.id}
            scopeStage={session.stages.find((s) => s.name === 'scope')}
            onDone={onRefresh}
          />
        )}
        {session.status === 'completed' && session.resultAppId && (
          <OpenAppPanel
            appId={session.resultAppId}
            onOpen={() => navigate(`/apps/${session.resultAppId}`)}
          />
        )}
        {session.status === 'failed' && <FailedPanel session={session} />}
        {session.status === 'cancelled' && <CancelledPanel session={session} />}
      </AnimatePresence>
    </PageShell>
  )
}

function computeActiveIdx(stages: SessionStage[]): number {
  const running = stages.findIndex((s) => s.status === 'running')
  if (running !== -1) return running
  const pending = stages.findIndex((s) => s.status === 'pending')
  if (pending !== -1) return pending
  return stages.length - 1
}

function Pipeline({
  stages,
  activeTab,
  onTabChange,
  stageUnlocked,
}: {
  stages: SessionStage[]
  activeTab: StageName
  onTabChange: (name: StageName) => void
  stageUnlocked: (name: StageName) => boolean
}) {
  return (
    <div className="bg-card border border-line rounded-[12px] px-4 py-3 mb-5 overflow-x-auto scrollbar-thin">
      <div className="flex items-center gap-[6px] min-w-max">
        {STAGES.map((s, i) => {
          const stage = stages.find((st) => st.name === s)
          const status = stage?.status ?? 'pending'
          const done = status === 'passed' || status === 'warning'
          const active = status === 'running'
          const failed = status === 'failed'
          const unlocked = stageUnlocked(s)
          const Info = STAGE_INFO[s]
          const Icon = Info.Icon

          const bg = failed
            ? '#fee2e2'
            : done
              ? '#eff6ff'
              : active
                ? '#2563eb'
                : '#ffffff'
          const border = failed
            ? '#fecaca'
            : done
              ? '#bfdbfe'
              : active
                ? '#2563eb'
                : '#e7e7e7'
          const color = failed
            ? '#b91c1c'
            : done
              ? '#2563eb'
              : active
                ? '#ffffff'
                : '#a3a3a3'

          return (
            <div key={s} className="flex items-center">
              <motion.button
                onClick={() => unlocked && onTabChange(s)}
                disabled={!unlocked}
                animate={{
                  backgroundColor: bg,
                  borderColor: border,
                  color,
                }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-[7px] px-[11px] py-[7px] rounded-[9px] text-[12px] font-semibold border ${
                  unlocked ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'
                } ${activeTab === s ? 'ring-2 ring-accent/30' : ''}`}
              >
                {failed ? (
                  <X size={12} strokeWidth={3} />
                ) : done ? (
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
                    done ? 'bg-accent' : 'bg-line'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Timeline({ stages }: { stages: SessionStage[] }) {
  return (
    <div className="bg-card border border-line rounded-[12px] p-5">
      <div className="font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-wider mb-4">
        DevOps Timeline
      </div>
      <div className="relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-line" />
        <div className="space-y-[14px]">
          {stages.map((stage) => (
            <TimelineItem key={stage.name} stage={stage} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TimelineItem({ stage }: { stage: SessionStage }) {
  const Info = STAGE_INFO[stage.name]
  const Icon = Info.Icon
  const done = stage.status === 'passed' || stage.status === 'warning'
  const active = stage.status === 'running'
  const failed = stage.status === 'failed'
  const upcoming = stage.status === 'pending'

  return (
    <div className="relative pl-[34px]">
      <motion.div
        animate={{
          backgroundColor: failed
            ? '#ef4444'
            : done
              ? '#2563eb'
              : '#ffffff',
          borderColor: failed
            ? '#ef4444'
            : done
              ? '#2563eb'
              : active
                ? '#2563eb'
                : '#e7e7e7',
        }}
        className="absolute left-0 top-[1px] w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center z-10"
      >
        {failed ? (
          <X size={11} strokeWidth={3} className="text-white" />
        ) : done ? (
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
      <div className="text-[11.5px] text-fg-muted leading-[1.55] mt-[4px] pr-2">
        {describeStage(stage)}
      </div>
    </div>
  )
}

function describeStage(stage: SessionStage): string {
  if (stage.status === 'pending') return STAGE_INFO[stage.name].tone
  if (stage.status === 'failed') return stage.errorMessage ?? 'Failed.'
  if (stage.status === 'warning' && stage.warnings?.length) {
    return stage.warnings.join(' · ')
  }
  switch (stage.name) {
    case 'parse':
      return stage.status === 'running'
        ? 'Extracting intent from prompt...'
        : 'Intent parsed into structured JSON.'
    case 'scope':
      return stage.status === 'running'
        ? 'Resolving minimum-privilege set...'
        : 'Minimum-privilege set resolved; review before proceeding.'
    case 'generate':
      return stage.status === 'running'
        ? 'Writing handler + manifest...'
        : 'Code + manifest generated.'
    case 'scan':
      return stage.status === 'running'
        ? 'SAST + dependency audit in flight...'
        : 'Security checks cleared.'
    case 'policy':
      return stage.status === 'running'
        ? 'Evaluating data / cost / compliance policies...'
        : 'Policy auto-approved.'
    case 'sandbox':
      return stage.status === 'running'
        ? 'Dry-run in isolated sandbox...'
        : 'Sandbox execution clean.'
    case 'deploy':
      return stage.status === 'running'
        ? 'Building, signing, publishing...'
        : 'Deployed and audited.'
  }
}

function ArtifactTerminal({
  stages,
  activeTab,
  onTabChange,
  stageUnlocked,
}: {
  stages: SessionStage[]
  activeTab: StageName
  onTabChange: (name: StageName) => void
  stageUnlocked: (name: StageName) => boolean
}) {
  const activeStage = stages.find((s) => s.name === activeTab)
  return (
    <div
      className="bg-[#0a0a0a] rounded-[12px] overflow-hidden flex flex-col"
      style={{ minHeight: 520 }}
    >
      <div className="flex items-center gap-[2px] px-3 pt-3 pb-0 border-b border-white/10 overflow-x-auto scrollbar-thin">
        {STAGES.map((s) => {
          const unlocked = stageUnlocked(s)
          const current = activeTab === s
          const stage = stages.find((st) => st.name === s)
          const pulse = stage?.status === 'running'
          const Info = STAGE_INFO[s]
          return (
            <button
              key={s}
              onClick={() => unlocked && onTabChange(s)}
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
              {pulse && !current && (
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
          <ArtifactContent stage={activeStage} />
        </motion.div>
      </div>
    </div>
  )
}

function ArtifactContent({ stage }: { stage: SessionStage | undefined }) {
  if (!stage) return <PendingNote text="No data yet." />
  if (stage.status === 'pending') {
    return <PendingNote text={`Stage "${stage.name}" has not started.`} />
  }
  if (stage.status === 'failed') {
    return (
      <div className="space-y-3">
        <SectionHeader icon="!" label={`${stage.name} failed`} />
        <div className="text-[#f87171]">{stage.errorMessage ?? 'Stage failed.'}</div>
      </div>
    )
  }
  const live = stage.status === 'running'
  const a = stage.artifact
  if (!a) return <PendingNote text="Artifact not yet produced." />
  switch (a.type) {
    case 'intent':
      return <IntentArtifact artifact={a} live={live} />
    case 'scope':
      return <ScopeArtifact artifact={a} live={live} />
    case 'code':
      return <CodeArtifact artifact={a} live={live} />
    case 'scan':
      return <ScanArtifact artifact={a} live={live} />
    case 'policy':
      return <PolicyArtifact artifact={a} live={live} />
    case 'sandbox':
      return <SandboxArtifact artifact={a} live={live} />
    case 'deploy':
      return <DeployArtifact artifact={a} live={live} />
  }
}

function PendingNote({ text }: { text: string }) {
  return <div className="text-white/40 text-[11.5px]">{text}</div>
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-white/40 text-[10px] mb-3 uppercase tracking-wider font-semibold">
      <span>{icon}</span> {label}
    </div>
  )
}

function IntentArtifact({
  artifact,
  live,
}: {
  artifact: Extract<StageArtifact, { type: 'intent' }>
  live: boolean
}) {
  const lines = JSON.stringify(artifact.json, null, 2).split('\n')
  return (
    <>
      <SectionHeader icon="◆" label="Parsed Intent" />
      <Stream lines={lines} live={live} color="text-white" />
    </>
  )
}

function ScopeArtifact({
  artifact,
  live,
}: {
  artifact: Extract<StageArtifact, { type: 'scope' }>
  live: boolean
}) {
  return (
    <>
      <SectionHeader icon="🔐" label="Minimum Privilege Resolution" />
      <div className="space-y-1 mb-4">
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
          Granted
        </div>
        {artifact.granted.map((a, i) => (
          <StreamRow key={`g-${i}`} live={live} delay={i * 80}>
            <span className="text-[#10b981]">+</span>{' '}
            <span className="text-white">{a.cap.padEnd(26)}</span>
            <span className="text-white/40">// {a.reason}</span>
          </StreamRow>
        ))}
      </div>
      <div className="space-y-1">
        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
          Denied (out of scope)
        </div>
        {artifact.denied.map((a, i) => (
          <StreamRow
            key={`d-${i}`}
            live={live}
            delay={(artifact.granted.length + i) * 80}
          >
            <span className="text-[#ef4444]">-</span>{' '}
            <span className="text-white/60">{a.cap.padEnd(26)}</span>
            <span className="text-white/40">// {a.reason}</span>
          </StreamRow>
        ))}
      </div>
    </>
  )
}

function CodeArtifact({
  artifact,
  live,
}: {
  artifact: Extract<StageArtifact, { type: 'code' }>
  live: boolean
}) {
  const lines = [
    '# manifest.yaml',
    ...artifact.manifestYaml.split('\n'),
    '',
    '# handler.ts',
    ...artifact.handlerTs.split('\n'),
  ]
  return (
    <>
      <SectionHeader icon="</>" label="Generated Source" />
      <Stream
        lines={lines}
        live={live}
        color="text-white"
        commentColor="text-white/45"
      />
    </>
  )
}

function ScanArtifact({
  artifact,
  live,
}: {
  artifact: Extract<StageArtifact, { type: 'scan' }>
  live: boolean
}) {
  const blocking = artifact.checks.filter((c) => c.result === 'fail').length
  const warns = artifact.checks.filter((c) => c.result === 'warn').length
  return (
    <>
      <SectionHeader icon="🛡" label="Security Scan Report" />
      <div className="space-y-[6px]">
        {artifact.checks.map((c, i) => (
          <StreamRow key={i} live={live} delay={i * 120}>
            {c.result === 'pass' ? (
              <span className="text-[#10b981]">✓</span>
            ) : c.result === 'warn' ? (
              <span className="text-[#f59e0b]">⚠</span>
            ) : (
              <span className="text-[#ef4444]">✗</span>
            )}{' '}
            <span className="text-white inline-block w-[220px]">{c.label}</span>
            <span className="text-white/45">{c.detail}</span>
          </StreamRow>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 text-[11px]">
        <span className="text-white/45">Summary:</span>{' '}
        <span className={blocking ? 'text-[#ef4444]' : 'text-[#10b981]'}>
          {blocking} blocking
        </span>{' '}
        <span className="text-white/30">·</span>{' '}
        <span className="text-[#f59e0b]">{warns} advisory</span>
      </div>
    </>
  )
}

function PolicyArtifact({
  artifact,
  live,
}: {
  artifact: Extract<StageArtifact, { type: 'policy' }>
  live: boolean
}) {
  return (
    <>
      <SectionHeader icon="§" label="Policy Check" />
      <div className="space-y-[5px]">
        {artifact.checks.map((r, i) => (
          <StreamRow key={i} live={live} delay={i * 110}>
            <span className={r.ok ? 'text-[#10b981]' : 'text-[#ef4444]'}>
              {r.ok ? '✓' : '✗'}
            </span>{' '}
            <span className="text-white/50 inline-block w-[180px]">{r.key}</span>
            <span className="text-white inline-block w-[200px]">{r.value}</span>
            <span className="text-white/45">{r.note}</span>
          </StreamRow>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/60">
        <span className="text-white/40">Verdict:</span>{' '}
        <span
          className={
            artifact.verdict === 'denied'
              ? 'text-[#ef4444]'
              : artifact.verdict === 'manual'
                ? 'text-[#f59e0b]'
                : 'text-[#10b981]'
          }
        >
          {artifact.verdict}
        </span>
      </div>
    </>
  )
}

function SandboxArtifact({
  artifact,
  live,
}: {
  artifact: Extract<StageArtifact, { type: 'sandbox' }>
  live: boolean
}) {
  return (
    <>
      <SectionHeader icon="⌘" label="Sandbox Dry-Run" />
      <div className="space-y-[3px]">
        {artifact.logs.map((l, i) => (
          <StreamRow key={i} live={live} delay={i * 90}>
            <span className="text-white/35">{l.t}</span>{' '}
            <span
              className={`inline-block w-[70px] ${
                l.tag === 'result'
                  ? 'text-[#10b981]'
                  : l.tag === 'cli' || l.tag === 'runtime'
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
        <span className={artifact.exitCode === 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}>
          {artifact.exitCode === 0 ? '✓ dry-run passed' : `✗ exit ${artifact.exitCode}`}
        </span>{' '}
        · duration {artifact.durationMs}ms
      </div>
    </>
  )
}

function DeployArtifact({
  artifact,
  live,
}: {
  artifact: Extract<StageArtifact, { type: 'deploy' }>
  live: boolean
}) {
  const steps: { label: string; v: string }[] = [
    { label: 'build', v: artifact.buildId },
    { label: 'sign', v: artifact.signed ? 'signed · cosign verified' : 'unsigned' },
    { label: 'push', v: artifact.artifactUri },
    { label: 'identity', v: 'runtime_identity → invoker' },
    { label: 'audit', v: 'audit stream enabled' },
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
      </div>
    </>
  )
}

function ConfirmScopePanel({
  sessionId,
  scopeStage,
  onDone,
}: {
  sessionId: string
  scopeStage: SessionStage | undefined
  onDone: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleConfirm = async () => {
    setConfirming(true)
    setErr(null)
    try {
      await confirmScope(sessionId)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setConfirming(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    setErr(null)
    try {
      await cancelSession(sessionId)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setCancelling(false)
    }
  }

  const scope =
    scopeStage?.artifact?.type === 'scope' ? scopeStage.artifact : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-6 bg-card border border-[#f59e0b]/40 rounded-[12px] p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0">
          <Lock size={18} className="text-[#b45309]" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-fg text-[15px]">
            Confirm capability scope before continuing
          </div>
          <div className="text-[12.5px] text-fg-muted mt-[2px]">
            Forge inferred the minimum-privilege set below. Review, then approve
            to let the pipeline continue. Capabilities are bound to the final
            deployed app.
          </div>
          {scope && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ScopeList title="Granted" items={scope.granted} tone="granted" />
              <ScopeList title="Denied" items={scope.denied} tone="denied" />
            </div>
          )}
          {err && (
            <div className="mt-3 text-[12px] text-[#b91c1c] font-mono">{err}</div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleConfirm}
              disabled={confirming || cancelling}
              className="px-4 py-[9px] bg-accent text-white rounded-[10px] font-semibold text-[13px] flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {confirming ? 'Confirming...' : 'Confirm & proceed'}
              {!confirming && <ArrowRight size={14} />}
            </button>
            <button
              onClick={handleCancel}
              disabled={confirming || cancelling}
              className="px-4 py-[9px] border border-line text-fg rounded-[10px] font-semibold text-[13px] hover:bg-card-muted transition-colors disabled:opacity-60"
            >
              {cancelling ? 'Cancelling...' : 'Cancel session'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ScopeList({
  title,
  items,
  tone,
}: {
  title: string
  items: { cap: string; reason: string }[]
  tone: 'granted' | 'denied'
}) {
  return (
    <div className="bg-bg rounded-[8px] border border-line p-3">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-subtle mb-2">
        {title}
      </div>
      <div className="space-y-[5px]">
        {items.length === 0 && (
          <div className="text-[11.5px] text-fg-subtle italic">(none)</div>
        )}
        {items.map((a) => (
          <div key={a.cap} className="text-[11.5px]">
            <span
              className={`font-mono font-semibold ${
                tone === 'granted' ? 'text-[#047857]' : 'text-[#b91c1c]'
              }`}
            >
              {tone === 'granted' ? '+' : '-'} {a.cap}
            </span>
            <div className="text-fg-muted text-[11px] pl-3 mt-[1px]">
              {a.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OpenAppPanel({
  appId,
  onOpen,
}: {
  appId: string
  onOpen: () => void
}) {
  return (
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
            app: {appId}
          </div>
        </div>
      </div>
      <button
        onClick={onOpen}
        className="px-5 py-[11px] bg-accent text-white rounded-[10px] font-semibold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors shrink-0"
      >
        Open App <ArrowRight size={15} />
      </button>
    </motion.div>
  )
}

function FailedPanel({ session }: { session: Session }) {
  const failed = session.stages.find((s) => s.status === 'failed')
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-6 bg-card border border-[#ef4444]/30 rounded-[12px] p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-[#b91c1c]" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-fg text-[15px]">Session failed</div>
          <div className="text-[12.5px] text-fg-muted mt-[2px]">
            {failed
              ? `Failed at stage "${failed.name}": ${failed.errorMessage ?? 'unknown error'}`
              : 'Session ended without deploying an app.'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CancelledPanel({ session }: { session: Session }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mt-6 bg-card border border-line rounded-[12px] p-5 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-card-muted flex items-center justify-center shrink-0">
        <X size={18} className="text-fg-muted" />
      </div>
      <div>
        <div className="font-bold text-fg text-[15px]">Session cancelled</div>
        <div className="text-[12.5px] text-fg-muted mt-[2px]">
          Cancelled at {session.finishedAt ?? 'unknown time'}. No app was deployed.
        </div>
      </div>
    </motion.div>
  )
}

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
