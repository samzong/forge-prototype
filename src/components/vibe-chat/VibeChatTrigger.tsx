import { Sparkles } from 'lucide-react'
import { useVibeChat, type VibeChatSubject } from './VibeChatContext'

type Variant = 'primary' | 'secondary' | 'icon'

type Props = {
  subject: VibeChatSubject
  variant?: Variant
  label?: string
  className?: string
}

export function VibeChatTrigger({ subject, variant = 'primary', label, className }: Props) {
  const { toggle, isOpen, subject: current } = useVibeChat()
  const active = isOpen && current?.id === subject.id && current?.type === subject.type

  const handleClick = () => toggle(subject)

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        aria-label="Open Vibe Chat"
        title="Chat to change this"
        className={`w-9 h-9 rounded-[9px] border flex items-center justify-center transition-colors ${
          active
            ? 'border-accent text-accent bg-accent-ultra'
            : 'border-line text-fg-muted hover:border-accent hover:text-accent'
        } ${className ?? ''}`}
      >
        <Sparkles size={15} />
      </button>
    )
  }

  if (variant === 'secondary') {
    return (
      <button
        onClick={handleClick}
        className={`px-[14px] py-2 bg-card border rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] transition-colors ${
          active
            ? 'border-accent text-accent bg-accent-ultra'
            : 'border-line text-fg-muted hover:border-accent hover:text-accent'
        } ${className ?? ''}`}
      >
        <Sparkles size={13} />
        {label ?? 'Chat'}
      </button>
    )
  }

  // primary
  return (
    <button
      onClick={handleClick}
      className={`px-[14px] py-2 rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] transition-colors ${
        active
          ? 'bg-accent text-white hover:bg-[#1d4ed8]'
          : 'bg-accent-ultra text-accent border border-accent/30 hover:bg-accent hover:text-white hover:border-accent'
      } ${className ?? ''}`}
    >
      <Sparkles size={13} />
      {label ?? 'Chat to edit'}
    </button>
  )
}
