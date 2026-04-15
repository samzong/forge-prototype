import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Galaxy } from '@/components/galaxy/Galaxy'
import { PromptBox } from '@/components/prompt/PromptBox'

export default function HomePage() {
  const [prompt, setPrompt] = useState('')
  const navigate = useNavigate()

  const handleSatellite = (hint: string) => {
    setPrompt(hint)
    requestAnimationFrame(() => {
      const input = document.getElementById('prompt-input') as HTMLInputElement | null
      if (input) {
        input.focus()
        input.setSelectionRange(hint.length, hint.length)
      }
    })
  }

  const handleSubmit = () => {
    const v = prompt.trim()
    if (!v) return
    navigate(`/generate?q=${encodeURIComponent(v)}`)
  }

  return (
    <div className="min-h-full flex items-center justify-center px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[820px] flex flex-col items-center"
      >
        <Galaxy onSatelliteClick={handleSatellite} />

        <div className="text-center -mt-4 mb-[18px]">
          <div className="flex items-center gap-[10px] justify-center font-mono text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.14em] mb-3">
            <span className="w-6 h-px bg-line" />
            Click a node · or describe what you need
            <span className="w-6 h-px bg-line" />
          </div>
          <h1 className="text-[42px] font-black tracking-[-0.025em] text-fg leading-none">
            Build{' '}
            <span className="text-accent italic font-black inline-block px-1">U</span> Apps
          </h1>
        </div>

        <PromptBox value={prompt} onChange={setPrompt} onSubmit={handleSubmit} />
      </motion.div>
    </div>
  )
}
