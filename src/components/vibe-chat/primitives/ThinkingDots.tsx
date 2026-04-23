import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export function ThinkingDots() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-[10px]"
    >
      <div className="w-[26px] h-[26px] rounded-[7px] bg-accent-ultra text-accent border border-accent/20 flex items-center justify-center shrink-0">
        <Bot size={13} />
      </div>
      <div className="flex items-center gap-[6px] pt-[8px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
            className="w-[5px] h-[5px] rounded-full bg-fg-subtle"
          />
        ))}
      </div>
    </motion.div>
  )
}
