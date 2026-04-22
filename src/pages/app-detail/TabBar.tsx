import { motion } from 'framer-motion'
import { TABS, type TabName } from './tabs'

interface Props {
  active: TabName
  onChange: (tab: TabName) => void
}

export function TabBar({ active, onChange }: Props) {
  return (
    <div className="px-8 bg-card border-b border-line overflow-x-auto scrollbar-thin">
      <div className="flex items-center gap-1 min-w-max">
        {TABS.map((t) => {
          const isActive = t.id === active
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`relative px-3 py-[10px] text-[13px] font-semibold transition-colors ${
                isActive ? 'text-accent' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {t.label}
              {isActive && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute left-2 right-2 bottom-0 h-[2px] bg-accent rounded-t-[2px]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
