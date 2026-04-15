import { motion } from 'framer-motion'

export function Core() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
      <motion.div
        className="w-[102px] h-[102px] rounded-full relative flex items-center justify-center"
        style={{
          background:
            'radial-gradient(circle at 35% 28%, #60a5fa 0%, #2563eb 55%, #1e3a8a 100%)',
        }}
        animate={{
          boxShadow: [
            '0 0 0 4px rgba(37,99,235,0.08), 0 0 0 14px rgba(37,99,235,0.04), 0 22px 60px -14px rgba(37,99,235,0.45)',
            '0 0 0 8px rgba(37,99,235,0.12), 0 0 0 22px rgba(37,99,235,0.05), 0 22px 80px -10px rgba(37,99,235,0.55)',
            '0 0 0 4px rgba(37,99,235,0.08), 0 0 0 14px rgba(37,99,235,0.04), 0 22px 60px -14px rgba(37,99,235,0.45)',
          ],
        }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute top-[18%] left-[22%] w-[30%] h-[20%] bg-white/25 rounded-full blur-md" />
        <span
          className="relative font-mono text-[19px] font-extrabold text-white tracking-tight"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.35)' }}
        >
          Forge
        </span>
      </motion.div>
    </div>
  )
}
