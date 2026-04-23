import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type VibeChatSubject = {
  type: 'app' | 'page' | 'custom'
  id: string
  name: string
  icon?: string
  description?: string
  capabilities?: string[]
}

export type VibeChatFocus = {
  target: string
  label: string
  path?: string
}

type VibeChatContextValue = {
  isOpen: boolean
  subject: VibeChatSubject | null
  open: (subject: VibeChatSubject) => void
  close: () => void
  toggle: (subject: VibeChatSubject) => void
  focus: VibeChatFocus | null
  setFocus: (focus: VibeChatFocus) => void
  clearFocus: () => void
  pickerActive: boolean
  startPicker: (subject: VibeChatSubject) => void
  stopPicker: () => void
}

const VibeChatContext = createContext<VibeChatContextValue | null>(null)

export function VibeChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [subject, setSubject] = useState<VibeChatSubject | null>(null)
  const [focus, setFocusState] = useState<VibeChatFocus | null>(null)
  const [pickerActive, setPickerActive] = useState(false)

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

  const setFocus = useCallback((next: VibeChatFocus) => {
    setFocusState(next)
  }, [])

  const clearFocus = useCallback(() => {
    setFocusState(null)
  }, [])

  const startPicker = useCallback((next: VibeChatSubject) => {
    setSubject(next)
    setIsOpen(false)
    setPickerActive(true)
  }, [])

  const stopPicker = useCallback(() => {
    setPickerActive(false)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      subject,
      open,
      close,
      toggle,
      focus,
      setFocus,
      clearFocus,
      pickerActive,
      startPicker,
      stopPicker,
    }),
    [isOpen, subject, open, close, toggle, focus, setFocus, clearFocus, pickerActive, startPicker, stopPicker],
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
