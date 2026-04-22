import type { Session, SessionStage, StageArtifact, StageName } from '@/types'
import type { Store } from './store'

const STAGE_ORDER: StageName[] = [
  'parse',
  'scope',
  'generate',
  'scan',
  'policy',
  'sandbox',
  'deploy',
]

const STAGE_DURATION_MS: Record<StageName, number> = {
  parse: 700,
  scope: 900,
  generate: 1600,
  scan: 800,
  policy: 600,
  sandbox: 1200,
  deploy: 1000,
}

interface DriverState {
  timers: ReturnType<typeof setTimeout>[]
  paused: boolean
}

const drivers = new Map<string, DriverState>()

export interface DriverHooks {
  store: Store<Session>
  artifactFor: (name: StageName, session: Session) => StageArtifact | undefined
  onDeployComplete: (session: Session) => void | Promise<void>
}

export function startDriver(sessionId: string, hooks: DriverHooks): void {
  stopDriver(sessionId)
  const state: DriverState = { timers: [], paused: false }
  drivers.set(sessionId, state)
  runStage(sessionId, 'parse', hooks, state)
}

export function resumeAfterConfirm(sessionId: string, hooks: DriverHooks): void {
  const state = drivers.get(sessionId)
  if (!state || !state.paused) return
  state.paused = false
  hooks.store.update(sessionId, { status: 'running' })
  runStage(sessionId, 'generate', hooks, state)
}

export function stopDriver(sessionId: string): void {
  const state = drivers.get(sessionId)
  if (!state) return
  for (const t of state.timers) clearTimeout(t)
  drivers.delete(sessionId)
}

function runStage(
  sessionId: string,
  name: StageName,
  hooks: DriverHooks,
  state: DriverState,
): void {
  const session = hooks.store.get(sessionId)
  if (!session) return
  if (state.paused) return

  const nowIso = new Date().toISOString()
  const stages: SessionStage[] = session.stages.map((s) =>
    s.name === name
      ? { ...s, status: 'running', startedAt: s.startedAt ?? nowIso }
      : s,
  )
  hooks.store.update(sessionId, { stages, status: 'running' })

  const t = setTimeout(
    () => onStageFinish(sessionId, name, hooks, state),
    STAGE_DURATION_MS[name],
  )
  state.timers.push(t)
}

async function onStageFinish(
  sessionId: string,
  name: StageName,
  hooks: DriverHooks,
  state: DriverState,
): Promise<void> {
  const session = hooks.store.get(sessionId)
  if (!session) return

  const artifact = hooks.artifactFor(name, session)
  const finishedIso = new Date().toISOString()
  const stages: SessionStage[] = session.stages.map((s) =>
    s.name === name
      ? { ...s, status: 'passed', finishedAt: finishedIso, artifact }
      : s,
  )
  hooks.store.update(sessionId, { stages })

  if (name === 'scope') {
    state.paused = true
    hooks.store.update(sessionId, { status: 'awaiting-confirm' })
    return
  }

  if (name === 'deploy') {
    const final = hooks.store.get(sessionId)
    if (final) await hooks.onDeployComplete(final)
    hooks.store.update(sessionId, {
      status: 'completed',
      finishedAt: finishedIso,
    })
    drivers.delete(sessionId)
    return
  }

  const nextIdx = STAGE_ORDER.indexOf(name) + 1
  if (nextIdx < STAGE_ORDER.length) {
    runStage(sessionId, STAGE_ORDER[nextIdx], hooks, state)
  }
}
