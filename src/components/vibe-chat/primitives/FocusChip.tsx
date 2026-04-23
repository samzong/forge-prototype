import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, X } from 'lucide-react'

export type FocusChipTarget = {
  label: string
}

interface Props {
  focus: FocusChipTarget | null
  onClear: () => void
}

export function FocusChip({ focus, onClear }: Props) {
  return (
    <AnimatePresence initial={false}>
      {focus && (
        <motion.div
          key="focus-chip"
          initial={{ opacity: 0, y: 4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 4, height: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-[6px] bg-accent-ultra border border-accent/30 rounded-[8px] pl-[9px] pr-[5px] py-[5px] mb-2">
            <Crosshair size={11} className="text-accent shrink-0" />
            <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-wider shrink-0">
              Focused
            </span>
            <span className="text-[11.5px] text-fg font-semibold truncate flex-1">
              {focus.label}
            </span>
            <button
              onClick={onClear}
              className="w-5 h-5 rounded flex items-center justify-center text-accent hover:bg-white/60 transition-colors shrink-0"
              title="Clear focus"
              aria-label="Clear focus"
            >
              <X size={11} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
