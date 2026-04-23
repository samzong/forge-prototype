import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { VibeChatProvider, VibeChatPanel, ElementPicker } from '@/components/vibe-chat'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  return (
    <VibeChatProvider>
      <div className="h-screen grid overflow-hidden" style={{ gridTemplateRows: '56px 1fr' }}>
        <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} sidebarOpen={sidebarOpen} />
        <main className="overflow-y-auto scrollbar-thin canvas-bg relative">
          <Outlet />
        </main>
        <VibeChatPanel />
        <ElementPicker />

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 top-14 bg-black/30 z-30"
              />
              <motion.div
                key="drawer"
                initial={{ x: -340 }}
                animate={{ x: 0 }}
                exit={{ x: -340 }}
                transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                className="fixed left-0 top-14 bottom-0 w-[320px] z-40"
              >
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </VibeChatProvider>
  )
}
