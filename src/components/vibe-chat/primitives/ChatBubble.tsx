import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'
import type { ReactNode } from 'react'

export type ChatBubbleRole = 'user' | 'assistant'

interface Props {
  role: ChatBubbleRole
  children: ReactNode
  animate?: boolean
}

const ASSISTANT_LABEL = 'forge · agent'
const USER_LABEL = 'you'

export function ChatBubble({ role, children, animate = true }: Props) {
  const isUser = role === 'user'
  const Wrapper = animate ? motion.div : 'div'
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.22 },
      }
    : {}

  return (
    <Wrapper className="flex gap-[10px]" {...motionProps}>
      <div
        className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-line-soft text-fg-muted'
            : 'bg-accent-ultra text-accent border border-accent/20'
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>
      <div className="flex-1 min-w-0 pt-[3px] space-y-[10px]">
        <div className="font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-wider">
          {isUser ? USER_LABEL : ASSISTANT_LABEL}
        </div>
        {children}
      </div>
    </Wrapper>
  )
}
