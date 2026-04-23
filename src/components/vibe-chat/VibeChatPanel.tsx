import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUp,
  Bot,
  Crosshair,
  Paperclip,
  Plus,
  Shield,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react'
import { useVibeChat, type VibeChatFocus, type VibeChatSubject } from './VibeChatContext'

type Role = 'user' | 'assistant'

type DiffBlock = {
  kind: 'diff'
  file: string
  lines: { type: ' ' | '+' | '-'; text: string }[]
}

type TextBlock = {
  kind: 'text'
  text: string
}

type PlanBlock = {
  kind: 'plan'
  items: string[]
}

type MessageBlock = TextBlock | DiffBlock | PlanBlock

type Message = {
  id: string
  role: Role
  blocks: MessageBlock[]
}

export function VibeChatPanel() {
  const { isOpen, subject, close, focus, clearFocus, startPicker } = useVibeChat()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  return (
    <AnimatePresence>
      {isOpen && subject && (
        <>
          <motion.div
            key="vibe-chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 top-14 bg-black/20 z-30"
          />
          <motion.aside
            key="vibe-chat-panel"
            initial={{ x: -420 }}
            animate={{ x: 0 }}
            exit={{ x: -420 }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            className="fixed left-0 top-14 bottom-0 w-[400px] z-40 bg-card border-r border-line shadow-[8px_0_24px_rgba(0,0,0,0.08)] flex flex-col"
          >
            <PanelHeader
              subject={subject}
              onClose={close}
              onPick={() => startPicker(subject)}
            />
            <ChatBody subject={subject} focus={focus} onClearFocus={clearFocus} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ============================================================================
 * Header
 * ========================================================================= */

function PanelHeader({
  subject,
  onClose,
  onPick,
}: {
  subject: VibeChatSubject
  onClose: () => void
  onPick: () => void
}) {
  return (
    <div className="shrink-0 border-b border-line">
      <div className="flex items-center justify-between px-4 h-[44px]">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-accent" />
          <span className="font-mono text-[10px] font-bold text-fg uppercase tracking-[0.12em]">
            Vibe Chat
          </span>
          <span className="font-mono text-[10px] text-fg-subtle">· agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPick}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-fg-muted hover:bg-line-soft hover:text-accent transition-colors"
            title="Pick a module in the app"
          >
            <Crosshair size={13} />
          </button>
          <button
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-fg-muted hover:bg-line-soft transition-colors"
            title="New chat"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-fg-muted hover:bg-line-soft transition-colors"
            title="Close (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-center gap-[10px] bg-bg border border-line rounded-[9px] px-[10px] py-[7px]">
          <div className="w-[26px] h-[26px] bg-accent text-white rounded-[7px] flex items-center justify-center font-mono text-[11px] font-extrabold shrink-0">
            {subject.icon ?? '◆'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[6px]">
              <span className="text-[12px] font-bold text-fg truncate">{subject.name}</span>
              <span className="font-mono text-[9px] px-[5px] py-[1px] bg-accent-ultra text-accent rounded font-bold uppercase tracking-wider shrink-0">
                {subject.type}
              </span>
            </div>
            {subject.description && (
              <div className="text-[11px] text-fg-muted truncate mt-[1px]">{subject.description}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
 * Body (messages + input)
 * ========================================================================= */

function ChatBody({
  subject,
  focus,
  onClearFocus,
}: {
  subject: VibeChatSubject
  focus: VibeChatFocus | null
  onClearFocus: () => void
}) {
  const initialMessages = useMemo(() => buildInitialMessages(subject), [subject.id, subject.type])
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, thinking])

  const handleSend = () => {
    const text = input.trim()
    if (!text || thinking) return
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      blocks: [{ kind: 'text', text }],
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)

    setTimeout(() => {
      const reply: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        blocks: [
          {
            kind: 'text',
            text: `Got it. I'll apply that change to **${subject.name}** behind a sandbox dry-run first, then surface a diff here for approval.`,
          },
          {
            kind: 'plan',
            items: [
              'Re-parse intent delta',
              'Re-resolve minimum privileges',
              'Regenerate handler.ts',
              'Re-run SAST + policy check',
              'Sandbox dry-run',
            ],
          },
        ],
      }
      setMessages((prev) => [...prev, reply])
      setThinking(false)
    }, 900)
  }

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4"
      >
        {messages.map((m) => (
          <MessageRow key={m.id} message={m} />
        ))}
        {thinking && <ThinkingRow />}
      </div>
      <InputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={thinking}
        subject={subject}
        focus={focus}
        onClearFocus={onClearFocus}
      />
    </>
  )
}

/* ============================================================================
 * Message rendering
 * ========================================================================= */

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex gap-[10px]"
    >
      <div
        className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 ${
          isUser ? 'bg-line-soft text-fg-muted' : 'bg-accent-ultra text-accent border border-accent/20'
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>
      <div className="flex-1 min-w-0 pt-[3px] space-y-[10px]">
        <div className="font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-wider">
          {isUser ? 'you' : 'forge · agent'}
        </div>
        {message.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} />
        ))}
      </div>
    </motion.div>
  )
}

function BlockRenderer({ block }: { block: MessageBlock }) {
  if (block.kind === 'text') {
    return (
      <div className="text-[13px] text-fg leading-[1.6]">
        {renderInlineMarkdown(block.text)}
      </div>
    )
  }
  if (block.kind === 'plan') {
    return (
      <div className="bg-bg border border-line rounded-[9px] px-3 py-[10px]">
        <div className="font-mono text-[9px] font-bold text-fg-subtle uppercase tracking-wider mb-[6px]">
          Plan · {block.items.length} steps
        </div>
        <ol className="space-y-[4px]">
          {block.items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-fg-muted">
              <span className="font-mono text-[10px] text-accent font-bold mt-[1px]">{i + 1}.</span>
              <span>{it}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }
  // diff
  return (
    <div className="bg-[#0a0a0a] rounded-[9px] overflow-hidden border border-black/20">
      <div className="flex items-center justify-between px-3 h-[28px] border-b border-white/10">
        <span className="font-mono text-[10px] text-white/55 uppercase tracking-wider">
          {block.file}
        </span>
        <span className="font-mono text-[9px] text-white/35">diff</span>
      </div>
      <div className="font-mono text-[11px] py-2">
        {block.lines.map((l, i) => {
          const bg =
            l.type === '+'
              ? 'bg-[#10b981]/15 text-[#86efac]'
              : l.type === '-'
                ? 'bg-[#ef4444]/15 text-[#fca5a5]'
                : 'text-white/70'
          return (
            <div key={i} className={`flex ${bg}`}>
              <span className="w-5 text-center select-none text-white/30">{l.type}</span>
              <span className="whitespace-pre pr-3">{l.text || '\u00A0'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ThinkingRow() {
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

/* ============================================================================
 * Input bar
 * ========================================================================= */

function InputBar({
  value,
  onChange,
  onSend,
  disabled,
  subject,
  focus,
  onClearFocus,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
  subject: VibeChatSubject
  focus: VibeChatFocus | null
  onClearFocus: () => void
}) {
  const placeholder = focus
    ? `Tune ${focus.label}…`
    : `Ask to change ${subject.name}…`
  return (
    <div className="shrink-0 border-t border-line bg-card px-3 pt-3 pb-3">
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
                onClick={onClearFocus}
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
      <div className="rounded-[11px] border border-line bg-bg focus-within:border-accent focus-within:bg-card transition-colors">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none bg-transparent px-3 pt-[9px] pb-1 text-[13px] text-fg placeholder:text-fg-subtle outline-none leading-[1.5]"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <button
              className="h-6 px-[7px] rounded-[6px] text-fg-subtle hover:text-fg hover:bg-line-soft text-[11px] font-medium flex items-center gap-[5px] transition-colors"
              title="Attach context"
            >
              <Paperclip size={11} /> context
            </button>
            <button
              className="h-6 px-[7px] rounded-[6px] text-fg-subtle hover:text-fg hover:bg-line-soft text-[11px] font-medium flex items-center gap-[5px] transition-colors"
              title="Capabilities"
            >
              <Shield size={11} /> caps
            </button>
          </div>
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="h-7 w-7 rounded-[7px] bg-accent text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1d4ed8] transition-colors"
            title="Send (Enter)"
          >
            <ArrowUp size={13} strokeWidth={3} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 px-1 font-mono text-[10px] text-fg-subtle">
        <span className="flex items-center gap-1">
          <Zap size={10} className="text-accent" />
          every change is sandboxed + audited
        </span>
        <span>⏎ send · ⇧⏎ newline</span>
      </div>
    </div>
  )
}

/* ============================================================================
 * Helpers
 * ========================================================================= */

function renderInlineMarkdown(text: string) {
  // Tiny inline renderer: supports **bold** and `code`. Avoids pulling a markdown dep.
  const parts: (string | JSX.Element)[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-bold text-fg">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[11.5px] px-[5px] py-[1px] bg-line-soft text-fg rounded border border-line"
        >
          {token.slice(1, -1)}
        </code>,
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function buildInitialMessages(subject: VibeChatSubject): Message[] {
  return [
    {
      id: 'seed-1',
      role: 'assistant',
      blocks: [
        {
          kind: 'text',
          text: `I have the full context of **${subject.name}** loaded — handler, manifest, schedule, last 10 runs. What do you want to change?`,
        },
      ],
    },
    {
      id: 'seed-2',
      role: 'user',
      blocks: [
        {
          kind: 'text',
          text: 'Push daily instead of weekly, and only when there are at least 3 criticals.',
        },
      ],
    },
    {
      id: 'seed-3',
      role: 'assistant',
      blocks: [
        {
          kind: 'text',
          text: 'Two edits: swap the cron to daily 9am, and guard delivery behind a `criticals >= 3` check. Diff preview:',
        },
        {
          kind: 'diff',
          file: 'handler.ts + manifest.yaml',
          lines: [
            { type: ' ', text: '# manifest.yaml' },
            { type: '-', text: "schedule: '0 9 * * MON'" },
            { type: '+', text: "schedule: '0 9 * * *'" },
            { type: ' ', text: '' },
            { type: ' ', text: '# handler.ts' },
            { type: ' ', text: '  const alerts = await ctx.cli(...)' },
            { type: '+', text: '  const criticals = alerts.filter(a => a.severity === "critical")' },
            { type: '+', text: '  if (criticals.length < 3) return ctx.skip("below threshold")' },
            { type: ' ', text: '' },
            { type: ' ', text: "  return ctx.render('team-alert.template', { alerts, pods })" },
          ],
        },
        {
          kind: 'text',
          text: 'No new capabilities required. Sandbox dry-run will run automatically before you confirm.',
        },
      ],
    },
  ]
}
