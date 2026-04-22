import type { Execution, ExecutionLog, ExecutionLogLevel, ExecutionLogTag } from '@/types'
import { executionsSeed } from './executions'

interface LogSpec {
  offsetMs: number
  level: ExecutionLogLevel
  tag: ExecutionLogTag
  message: string
}

function plus(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString()
}

function mkLogs(execution: Execution, specs: LogSpec[]): ExecutionLog[] {
  return specs.map((s, i) => ({
    id: `${execution.id}-l${i + 1}`,
    executionId: execution.id,
    timestamp: plus(execution.startedAt, s.offsetMs),
    level: s.level,
    tag: s.tag,
    message: s.message,
  }))
}

function succeededSpec(execution: Execution): LogSpec[] {
  const duration = execution.durationMs ?? 4000
  return [
    { offsetMs: 0, level: 'info', tag: 'sandbox', message: 'sandbox: starting container for run' },
    { offsetMs: 180, level: 'info', tag: 'runtime', message: `runtime: loaded version ${execution.versionId}` },
    { offsetMs: 420, level: 'debug', tag: 'runtime', message: 'runtime: resolving capability grants' },
    {
      offsetMs: Math.floor(duration * 0.3),
      level: 'info',
      tag: 'runtime',
      message: 'runtime: entering handler.run()',
    },
    {
      offsetMs: Math.floor(duration * 0.55),
      level: 'debug',
      tag: 'result',
      message: 'result: producing summary payload',
    },
    {
      offsetMs: Math.floor(duration * 0.85),
      level: 'info',
      tag: 'render',
      message: 'render: delivery channel accepted payload',
    },
    {
      offsetMs: duration - 40,
      level: 'info',
      tag: 'sandbox',
      message: `sandbox: run complete · exit=0 · duration=${duration}ms`,
    },
  ]
}

function failedSpec(execution: Execution): LogSpec[] {
  const duration = execution.durationMs ?? 5000
  const err = execution.errorMessage ?? 'unspecified failure'
  return [
    { offsetMs: 0, level: 'info', tag: 'sandbox', message: 'sandbox: starting container for run' },
    { offsetMs: 200, level: 'info', tag: 'runtime', message: `runtime: loaded version ${execution.versionId}` },
    {
      offsetMs: Math.floor(duration * 0.4),
      level: 'info',
      tag: 'runtime',
      message: 'runtime: entering handler.run()',
    },
    {
      offsetMs: Math.floor(duration * 0.7),
      level: 'warn',
      tag: 'runtime',
      message: 'runtime: upstream returned non-2xx, retrying (1/3)',
    },
    {
      offsetMs: Math.floor(duration * 0.85),
      level: 'warn',
      tag: 'runtime',
      message: 'runtime: upstream returned non-2xx, retrying (2/3)',
    },
    {
      offsetMs: Math.floor(duration * 0.95),
      level: 'error',
      tag: 'runtime',
      message: `runtime: ${err}`,
    },
    {
      offsetMs: duration - 20,
      level: 'error',
      tag: 'sandbox',
      message: `sandbox: run failed · exit=1 · duration=${duration}ms`,
    },
  ]
}

function timeoutSpec(execution: Execution): LogSpec[] {
  const duration = execution.durationMs ?? 60_000
  return [
    { offsetMs: 0, level: 'info', tag: 'sandbox', message: 'sandbox: starting container for run' },
    { offsetMs: 250, level: 'info', tag: 'runtime', message: `runtime: loaded version ${execution.versionId}` },
    { offsetMs: 1200, level: 'info', tag: 'runtime', message: 'runtime: entering handler.run()' },
    {
      offsetMs: Math.floor(duration * 0.5),
      level: 'debug',
      tag: 'runtime',
      message: 'runtime: still processing, progress=50%',
    },
    {
      offsetMs: Math.floor(duration * 0.85),
      level: 'warn',
      tag: 'runtime',
      message: 'runtime: approaching sandbox deadline',
    },
    {
      offsetMs: duration - 10,
      level: 'error',
      tag: 'sandbox',
      message: `sandbox: deadline exceeded · killed · duration=${duration}ms`,
    },
  ]
}

function runningSpec(execution: Execution): LogSpec[] {
  return [
    { offsetMs: 0, level: 'info', tag: 'sandbox', message: 'sandbox: starting container for run' },
    {
      offsetMs: 220,
      level: 'info',
      tag: 'runtime',
      message: `runtime: loaded version ${execution.versionId}`,
    },
    { offsetMs: 900, level: 'info', tag: 'runtime', message: 'runtime: entering handler.run()' },
    { offsetMs: 2100, level: 'debug', tag: 'runtime', message: 'runtime: fetching upstream data' },
    { offsetMs: 3600, level: 'debug', tag: 'runtime', message: 'runtime: processing chunk 1/8' },
  ]
}

function cancelledSpec(execution: Execution): LogSpec[] {
  const duration = execution.durationMs ?? 2000
  return [
    { offsetMs: 0, level: 'info', tag: 'sandbox', message: 'sandbox: starting container for run' },
    {
      offsetMs: 240,
      level: 'info',
      tag: 'runtime',
      message: `runtime: loaded version ${execution.versionId}`,
    },
    {
      offsetMs: Math.floor(duration * 0.6),
      level: 'warn',
      tag: 'user',
      message: `user: cancel signal received from ${execution.triggeredBy ?? 'system'}`,
    },
    {
      offsetMs: duration - 10,
      level: 'info',
      tag: 'sandbox',
      message: `sandbox: run cancelled · exit=130 · duration=${duration}ms`,
    },
  ]
}

function logsFor(execution: Execution): ExecutionLog[] {
  switch (execution.status) {
    case 'succeeded':
      return mkLogs(execution, succeededSpec(execution))
    case 'failed':
      return mkLogs(execution, failedSpec(execution))
    case 'timeout':
      return mkLogs(execution, timeoutSpec(execution))
    case 'running':
      return mkLogs(execution, runningSpec(execution))
    case 'cancelled':
      return mkLogs(execution, cancelledSpec(execution))
  }
}

export const executionLogsSeed: ExecutionLog[] = executionsSeed.flatMap(logsFor)
