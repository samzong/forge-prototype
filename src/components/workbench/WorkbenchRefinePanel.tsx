import { useRef, useState } from 'react'
import { Crosshair, Sparkles, Zap } from 'lucide-react'
import type { SpecDraft, RefineTurn } from '@/types'
import { ChatBubble } from '@/components/vibe-chat/primitives/ChatBubble'
import { ChatInputShell } from '@/components/vibe-chat/primitives/ChatInputShell'
import {
  ElementPicker,
  type PickerHit,
} from '@/components/vibe-chat/primitives/ElementPicker'
import { FocusChip } from '@/components/vibe-chat/primitives/FocusChip'
import { ThinkingDots } from '@/components/vibe-chat/primitives/ThinkingDots'
import { renderInlineMarkdown } from '@/components/vibe-chat/primitives/inlineMarkdown'
import { useAutoScrollToBottom } from '@/components/vibe-chat/primitives/useAutoScrollToBottom'

const PREVIEW_ROOT_SELECTOR = '[data-vibe-root="workbench-preview"]'

interface Props {
  draft: SpecDraft
  onSend: (message: string) => void
  pending: boolean
}

export function WorkbenchRefinePanel({ draft, onSend, pending }: Props) {
  const [input, setInput] = useState('')
  const [pickerActive, setPickerActive] = useState(false)
  const [focus, setFocus] = useState<PickerHit | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useAutoScrollToBottom(scrollRef, [draft.turns.length, pending])

  const handleSend = () => {
    const text = input.trim()
    if (!text || pending) return
    onSend(text)
    setInput('')
    setFocus(null)
  }

  const placeholder = focus
    ? `Tune ${focus.label}…`
    : 'Refine the draft… e.g. only send when there are more than 3 critical alerts'

  return (
    <div className="h-full flex flex-col bg-card border-r border-line">
      <div className="shrink-0 h-[40px] border-b border-line flex items-center gap-2 px-4">
        <Sparkles size={13} className="text-accent" />
        <span className="font-mono text-[10px] font-bold text-fg uppercase tracking-[0.12em]">
          Vibe Chat
        </span>
        <span className="font-mono text-[10px] text-fg-subtle">· refine</span>
        <button
          onClick={() => setPickerActive((v) => !v)}
          title="Pick a block in the preview"
          aria-label="Pick preview block"
          aria-pressed={pickerActive}
          className={`ml-auto w-7 h-7 rounded-[7px] flex items-center justify-center transition-colors ${
            pickerActive
              ? 'bg-accent text-white'
              : 'text-fg-muted hover:bg-line-soft hover:text-accent'
          }`}
        >
          <Crosshair size={13} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4 min-h-0"
      >
        {draft.turns.map((t) => (
          <TurnRow key={t.id} turn={t} />
        ))}
        {pending && <ThinkingDots />}
      </div>

      <ChatInputShell
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={pending}
        placeholder={placeholder}
        topSlot={
          <FocusChip
            focus={focus ? { label: focus.label } : null}
            onClear={() => setFocus(null)}
          />
        }
        footerHint={
          <span className="flex items-center gap-1">
            <Zap size={10} className="text-accent" />
            each turn becomes a version
          </span>
        }
      />

      <ElementPicker
        active={pickerActive}
        rootSelector={PREVIEW_ROOT_SELECTOR}
        onPick={(hit) => {
          setFocus(hit)
          setPickerActive(false)
        }}
        onCancel={() => setPickerActive(false)}
      />
    </div>
  )
}

function TurnRow({ turn }: { turn: RefineTurn }) {
  const isUser = turn.role === 'user'
  return (
    <ChatBubble role={turn.role} animate={false}>
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
    </ChatBubble>
  )
}
