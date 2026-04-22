import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function InfoPanel({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-card border border-line rounded-[11px] p-[14px]">
      <div className="flex items-center gap-[6px] font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-[0.1em] mb-[9px]">
        {icon}
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function DeliveryRow({ label, target }: { label: string; target: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="font-mono text-fg-subtle uppercase w-[44px]">{label}</span>
      <span className="font-mono text-fg">{target}</span>
    </div>
  )
}

export function RunningPulse({ on }: { on: boolean }) {
  if (!on) {
    return (
      <span className="font-mono text-[10px] uppercase px-2 py-[3px] rounded font-bold tracking-wider bg-[#f3f4f6] text-fg-muted">
        paused
      </span>
    )
  }
  return (
    <span className="flex items-center gap-[6px] px-2 py-[3px] rounded bg-[#d1fae5]">
      <span className="relative w-[7px] h-[7px]">
        <span className="absolute inset-0 rounded-full bg-[#10b981]" />
        <motion.span
          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-[#10b981]"
        />
      </span>
      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#065f46]">
        running
      </span>
    </span>
  )
}
