import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, Paperclip, Shield, Sparkles, User, Zap } from 'lucide-react'
import type { SpecDraft, RefineTurn } from '@/types'

interface Props {
  draft: SpecDraft
  onSend: (message: string) => void
  pending: boolean
}

export function WorkbenchRefinePanel({ draft, onSend, pending }: Props) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [draft.turns.length, pending])

  const handleSend = () => {
    const text = input.trim()
    if (!text || pending) return
    onSend(text)
    setInput('')
  }

  return (
    <div className="h-full flex flex-col bg-card border-r border-line">
      <div className="shrink-0 h-[40px] border-b border-line flex items-center gap-2 px-4">
        <Sparkles size={13} className="text-accent" />
        <span className="font-mono text-[10px] font-bold text-fg uppercase tracking-[0.12em]">
          Vibe Chat
        </span>
        <span className="font-mono text-[10px] text-fg-subtle">· refine</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4 min-h-0"
      >
        {draft.turns.map((t) => (
          <TurnRow key={t.id} turn={t} />
        ))}
        {pending && <ThinkingRow />}
      </div>

      <InputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={pending}
      />
    </div>
  )
}

function TurnRow({ turn }: { turn: RefineTurn }) {
  const isUser = turn.role === 'user'
  return (
    <div className="flex gap-[10px]">
      <div
        className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0 ${
          isUser ? 'bg-line-soft text-fg-muted' : 'bg-accent-ultra text-accent border border-accent/20'
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>
      <div className="flex-1 min-w-0 pt-[3px] space-y-[8px]">
        <div className="font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-wider">
          {isUser ? 'you' : 'forge · agent'}
        </div>
        <div className="text-[13px] text-fg leading-[1.6] whitespace-pre-wrap break-words">
          {renderInlineMarkdown(turn.content)}
        </div>
        {turn.specSnapshot && !isUser && (
          <div className="bg-bg border border-line rounded-[9px] px-3 py-[8px]">
            <div className="font-mono text-[9px] font-bold text-fg-subtle uppercase tracking-wider mb-[4px]">
              Spec snapshot
            </div>
            <div className="text-[12px] text-fg-muted leading-[1.5]">
              <span className="font-mono text-[11px] text-accent font-semibold">
                {turn.specSnapshot.viewKind}
              </span>
              <span className="text-line mx-1">·</span>
              <span className="font-medium text-fg">{turn.specSnapshot.name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingRow() {
  return (
    <div className="flex gap-[10px]">
      <div className="w-[26px] h-[26px] rounded-[7px] bg-accent-ultra text-accent border border-accent/20 flex items-center justify-center shrink-0">
        <Bot size={13} />
      </div>
      <div className="flex items-center gap-[6px] pt-[8px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[5px] h-[5px] rounded-full bg-fg-subtle animate-pulse"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function InputBar({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
}) {
  return (
    <div className="shrink-0 border-t border-line bg-card px-3 pt-3 pb-3">
      <div className="rounded-[11px] border border-line bg-bg focus-within:border-accent focus-within:bg-card transition-colors">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder="Refine the draft… e.g. only send when there are more than 3 critical alerts"
          rows={2}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-3 pt-[9px] pb-1 text-[13px] text-fg placeholder:text-fg-subtle outline-none leading-[1.5] disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-6 px-[7px] rounded-[6px] text-fg-subtle hover:text-fg hover:bg-line-soft text-[11px] font-medium flex items-center gap-[5px] transition-colors"
              title="Attach context"
            >
              <Paperclip size={11} /> context
            </button>
            <button
              type="button"
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
          each turn becomes a version
        </span>
        <span>⏎ send · ⇧⏎ newline</span>
      </div>
    </div>
  )
}

function renderInlineMarkdown(text: string) {
  const parts: (string | JSX.Element)[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
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
