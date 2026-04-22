export function shouldInject(resource: string, method: string): Error | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('mockError')
  if (!raw) return null
  const target = `${resource}.${method}`
  const targets = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return targets.includes(target) ? new Error(`Mock error: ${target}`) : null
}
