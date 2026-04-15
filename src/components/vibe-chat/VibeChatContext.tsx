import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type VibeChatSubject = {
  type: 'app' | 'page' | 'custom'
  id: string
  name: string
  icon?: string
  description?: string
  capabilities?: string[]
}

type VibeChatContextValue = {
  isOpen: boolean
  subject: VibeChatSubject | null
  open: (subject: VibeChatSubject) => void
  close: () => void
  toggle: (subject: VibeChatSubject) => void
}

const VibeChatContext = createContext<VibeChatContextValue | null>(null)

export function VibeChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [subject, setSubject] = useState<VibeChatSubject | null>(null)

  const open = useCallback((next: VibeChatSubject) => {
    setSubject(next)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback((next: VibeChatSubject) => {
    setSubject((prev) => {
      const sameSubject = prev?.id === next.id && prev?.type === next.type
      setIsOpen((wasOpen) => !(wasOpen && sameSubject))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ isOpen, subject, open, close, toggle }),
    [isOpen, subject, open, close, toggle],
  )

  return <VibeChatContext.Provider value={value}>{children}</VibeChatContext.Provider>
}

export function useVibeChat(): VibeChatContextValue {
  const ctx = useContext(VibeChatContext)
  if (!ctx) {
    throw new Error('useVibeChat must be used within a VibeChatProvider')
  }
  return ctx
}
