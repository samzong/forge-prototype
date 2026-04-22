interface Props {
  iso: string
  className?: string
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const diffSec = Math.round((t - now.getTime()) / 1000)
  const abs = Math.abs(diffSec)
  const future = diffSec > 0

  if (abs < 45) return 'just now'

  const units: Array<[number, string]> = [
    [60, 's'],
    [3600, 'm'],
    [86400, 'h'],
    [2592000, 'd'],
  ]
  for (let i = 0; i < units.length; i++) {
    const [nextBoundary, label] = units[i]
    if (abs < nextBoundary) {
      const prev = i === 0 ? 1 : units[i - 1][0]
      const n = Math.max(1, Math.round(abs / prev))
      return future ? `in ${n}${label}` : `${n}${label} ago`
    }
  }
  const months = Math.round(abs / 2592000)
  return future ? `in ${months}mo` : `${months}mo ago`
}

export function absoluteTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function RelativeTime({ iso, className }: Props) {
  return (
    <span className={className} title={absoluteTime(iso)}>
      {relativeTime(iso)}
    </span>
  )
}
