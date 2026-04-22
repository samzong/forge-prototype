const DEFAULT_MIN_MS = 50
const DEFAULT_MAX_MS = 300

export function jitter(min = DEFAULT_MIN_MS, max = DEFAULT_MAX_MS): Promise<void> {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  const ms = lo + Math.random() * (hi - lo)
  return new Promise((resolve) => setTimeout(resolve, ms))
}
