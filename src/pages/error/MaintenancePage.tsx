import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Wrench } from 'lucide-react'
import { useCurrentTenant } from '@/hooks/useCurrentTenant'
import { ErrorPageShell } from './ErrorPageShell'

export default function MaintenancePage() {
  const { data: tenant } = useCurrentTenant()
  const until = tenant?.maintenanceUntil
  const countdown = useCountdown(until)

  return (
    <ErrorPageShell
      code="Maintenance"
      tone="warn"
      title="Forge is undergoing scheduled maintenance"
      description={
        <>
          Some tenant-scoped services are temporarily paused for a platform upgrade. You
          can still browse read-only pages; mutations may fail until the window closes.
        </>
      }
      footer={tenant ? `Tenant · ${tenant.name}` : 'Forge prototype · Maintenance'}
    >
      {countdown && (
        <div className="inline-flex items-center gap-3 px-4 py-3 bg-card border border-line rounded-[10px] mb-5">
          <Wrench size={14} className="text-[#b45309]" strokeWidth={2.2} />
          <div className="text-left">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-subtle">
              Estimated resume in
            </div>
            <div className="font-mono text-[15px] font-black text-fg tabular-nums mt-[2px]">
              {countdown}
            </div>
          </div>
        </div>
      )}
      {!countdown && until && (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-accent-ultra border border-accent/20 text-accent font-mono text-[11px] uppercase tracking-[0.14em] rounded-[8px] mb-5">
          Maintenance window complete · refresh to continue
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-accent text-white text-[13px] font-semibold rounded-[9px] border border-accent hover:bg-[#1d4ed8] transition-colors"
        >
          <Home size={14} strokeWidth={2.2} />
          Back home
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-[10px] bg-card text-fg text-[13px] font-semibold rounded-[9px] border border-line hover:border-accent hover:text-accent transition-colors"
        >
          Check again
        </button>
      </div>
    </ErrorPageShell>
  )
}

function useCountdown(untilIso: string | undefined): string | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!untilIso) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [untilIso])
  if (!untilIso) return null
  const target = Date.parse(untilIso)
  if (Number.isNaN(target)) return null
  const delta = target - now
  if (delta <= 0) return null
  const totalSec = Math.floor(delta / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}
