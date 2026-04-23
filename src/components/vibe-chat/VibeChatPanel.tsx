import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, Plus, Sparkles, X, Zap } from 'lucide-react'
import { useVibeChat, type VibeChatSubject } from './VibeChatContext'
import { ChatBubble } from './primitives/ChatBubble'
import { ChatInputShell } from './primitives/ChatInputShell'
import { ElementPicker } from './primitives/ElementPicker'
import { FocusChip } from './primitives/FocusChip'
import { ThinkingDots } from './primitives/ThinkingDots'
import { renderInlineMarkdown } from './primitives/inlineMarkdown'
import { useAutoScrollToBottom } from './primitives/useAutoScrollToBottom'

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

export function VibeChatElementPicker() {
  const { pickerActive, stopPicker, setFocus, subject, open } = useVibeChat()
  return (
    <ElementPicker
      active={pickerActive}
      onCancel={stopPicker}
      onPick={(hit) => {
        setFocus({ target: hit.target, label: hit.label, path: hit.path })
        stopPicker()
        if (subject) open(subject)
      }}
    />
  )
}

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

function ChatBody({
  subject,
  focus,
  onClearFocus,
}: {
  subject: VibeChatSubject
  focus: { target: string; label: string; path?: string } | null
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

  useAutoScrollToBottom(scrollRef, [messages, thinking])

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

  const placeholder = focus ? `Tune ${focus.label}…` : `Ask to change ${subject.name}…`

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4"
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role}>
            {m.blocks.map((b, i) => (
              <BlockRenderer key={i} block={b} />
            ))}
          </ChatBubble>
        ))}
        {thinking && <ThinkingDots />}
      </div>
      <ChatInputShell
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={thinking}
        placeholder={placeholder}
        topSlot={
          <FocusChip
            focus={focus ? { label: focus.label } : null}
            onClear={onClearFocus}
          />
        }
        footerHint={
          <span className="flex items-center gap-1">
            <Zap size={10} className="text-accent" />
            every change is sandboxed + audited
          </span>
        }
      />
    </>
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
