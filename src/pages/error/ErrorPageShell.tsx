import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  code: string
  title: string
  description: ReactNode
  tone?: 'info' | 'warn' | 'danger'
  footer?: ReactNode
  children?: ReactNode
}

const TONE_MAP = {
  info: {
    code: 'text-accent',
    glow: 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.18), transparent 70%)',
  },
  warn: {
    code: 'text-[#b45309]',
    glow: 'radial-gradient(circle at 50% 50%, rgba(180,83,9,0.16), transparent 70%)',
  },
  danger: {
    code: 'text-[#b91c1c]',
    glow: 'radial-gradient(circle at 50% 50%, rgba(185,28,28,0.16), transparent 70%)',
  },
}

export function ErrorPageShell({
  code,
  title,
  description,
  tone = 'info',
  footer,
  children,
}: Props) {
  const toneCfg = TONE_MAP[tone]
  const codeFontSize =
    code.length > 4 ? 'clamp(40px, 8vw, 72px)' : 'clamp(96px, 18vw, 160px)'
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-10 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: toneCfg.glow }}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[620px] text-center"
      >
        <div
          className={`font-mono font-black tracking-[-0.04em] leading-none ${toneCfg.code}`}
          style={{ fontSize: codeFontSize }}
        >
          {code}
        </div>
        <h1 className="mt-4 text-[28px] font-black tracking-[-0.02em] text-fg">
          {title}
        </h1>
        <div className="mt-3 text-[14px] text-fg-muted leading-[1.6] max-w-[480px] mx-auto">
          {description}
        </div>
        {children && <div className="mt-7">{children}</div>}
        {footer && (
          <div className="mt-10 pt-6 border-t border-line-soft text-[11px] font-mono text-fg-subtle uppercase tracking-[0.14em]">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  )
}
