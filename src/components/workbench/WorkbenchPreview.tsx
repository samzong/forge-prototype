import { useState } from 'react'
import { Eye, FileCode2, History, Layers, MessageSquare, Sliders } from 'lucide-react'
import type { AppViewKind, SpecDraft, SpecSnapshot } from '@/types'

interface Props {
  draft: SpecDraft
  spec: SpecSnapshot
  historical?: { versionLabel: string; onExit: () => void }
}

type TabKey = 'preview' | 'spec' | 'settings'

const TABS: Array<{ key: TabKey; label: string; Icon: typeof Eye }> = [
  { key: 'preview', label: 'Preview', Icon: Eye },
  { key: 'spec', label: 'Spec', Icon: FileCode2 },
  { key: 'settings', label: 'Settings', Icon: Sliders },
]

export function WorkbenchPreview({ draft, spec, historical }: Props) {
  const [tab, setTab] = useState<TabKey>('preview')
  const historicalVisible = !!historical && tab !== 'settings'

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="shrink-0 h-[40px] border-b border-line bg-card relative flex items-center justify-center px-3">
        <div className="inline-flex items-center gap-[2px] p-[2px] rounded-[9px] bg-bg border border-line">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`h-[26px] px-[12px] rounded-[7px] text-[11.5px] font-semibold flex items-center gap-[6px] transition-colors ${
                  active
                    ? 'bg-card text-accent shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                    : 'text-fg-subtle hover:text-fg'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            )
          })}
        </div>

        {historicalVisible && historical && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-[5px]">
              <History size={11} />
              viewing {historical.versionLabel}
            </span>
            <button
              onClick={historical.onExit}
              className="h-[24px] px-[9px] rounded-[6px] text-[11px] font-semibold text-accent hover:bg-accent-ultra transition-colors"
            >
              Back to latest
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-8 min-h-0">
        <div className="mx-auto max-w-[720px]">
          {tab === 'preview' && <PreviewBody spec={spec} />}
          {tab === 'spec' && <SpecBody spec={spec} />}
          {tab === 'settings' && <SettingsBody draft={draft} />}
        </div>
      </div>
    </div>
  )
}

function PreviewBody({ spec }: { spec: SpecSnapshot }) {
  return (
    <>
      <div className="bg-card border border-line rounded-[14px] p-6 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.08)]">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-accent-ultra text-accent border border-accent/20 rounded-[10px] flex items-center justify-center font-mono text-[13px] font-extrabold shrink-0">
            ◆
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[18px] font-bold text-fg leading-tight">{spec.name}</h2>
              <span className="font-mono text-[10px] px-[6px] py-[2px] bg-accent-ultra text-accent rounded font-bold uppercase tracking-wider">
                {spec.viewKind}
              </span>
            </div>
            <p className="text-[13px] text-fg-muted mt-[6px] leading-[1.55]">
              {spec.description || 'No description captured yet.'}
            </p>
          </div>
        </div>
        <PlaceholderCanvas viewKind={spec.viewKind} />
      </div>
      <div className="mt-5 flex items-center gap-2 font-mono text-[10px] text-fg-subtle uppercase tracking-[0.14em]">
        <Layers size={11} />
        <span>Preview is schematic · full dry-run appears after publish</span>
      </div>
    </>
  )
}

function SpecBody({ spec }: { spec: SpecSnapshot }) {
  return (
    <div className="bg-card border border-line rounded-[14px] divide-y divide-line">
      <SpecField label="Name" value={spec.name} />
      <SpecField label="View kind" value={spec.viewKind} mono />
      <SpecField
        label="Description"
        value={spec.description || '—'}
        multiline
      />
      <div className="px-5 py-4">
        <div className="font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-[0.14em] mb-2">
          Capabilities
        </div>
        {spec.capabilities.length === 0 ? (
          <p className="text-[12.5px] text-fg-subtle italic">
            No capabilities inferred yet · mention them in refine
          </p>
        ) : (
          <ul className="flex flex-wrap gap-[6px]">
            {spec.capabilities.map((c) => (
              <li
                key={c}
                className="font-mono text-[11px] px-[8px] py-[3px] bg-bg border border-line rounded-[6px] text-fg-muted"
              >
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SettingsBody({ draft }: { draft: SpecDraft }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-line rounded-[14px] p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-accent-ultra text-accent border border-accent/20 rounded-[8px] flex items-center justify-center shrink-0">
            <MessageSquare size={13} />
          </div>
          <div>
            <h3 className="text-[13.5px] font-bold text-fg">Settings are conversational</h3>
            <p className="text-[12.5px] text-fg-muted mt-[6px] leading-[1.55]">
              This is a draft. Triggers, schedules, permissions, and retention
              crystallize into the AppManifest on publish. To change anything,
              tell refine — don't come here to fill forms.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-line rounded-[14px] divide-y divide-line">
        <SpecField label="Draft status" value={draft.status} mono />
        <SpecField label="Created by" value={draft.createdBy} mono />
        <SpecField label="Created at" value={formatDateTime(draft.createdAt)} mono />
        <SpecField label="Updated at" value={formatDateTime(draft.updatedAt)} mono />
      </div>
    </div>
  )
}

function SpecField({
  label,
  value,
  mono,
  multiline,
}: {
  label: string
  value: string
  mono?: boolean
  multiline?: boolean
}) {
  return (
    <div className="px-5 py-4">
      <div className="font-mono text-[10px] font-bold text-fg-subtle uppercase tracking-[0.14em] mb-1">
        {label}
      </div>
      <div
        className={`text-[13px] ${mono ? 'font-mono' : ''} ${
          multiline ? 'text-fg-muted leading-[1.55]' : 'text-fg font-semibold'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

const PLACEHOLDER_BLOCKS: Record<AppViewKind, string[]> = {
  dashboard: ['Headline metric', 'Trend chart', 'Breakdown table'],
  notifier: ['Trigger', 'Condition', 'Message card'],
  report: ['Executive summary', 'Section: this week', 'Section: open items'],
  form: ['Field: title', 'Field: details', 'Submit action'],
  bot: ['System prompt', 'Allowed tools', 'Example turn'],
}

function PlaceholderCanvas({ viewKind }: { viewKind: AppViewKind }) {
  const items = PLACEHOLDER_BLOCKS[viewKind]
  return (
    <div className="mt-2 grid grid-cols-1 gap-2">
      {items.map((label, i) => (
        <div
          key={i}
          className="border border-dashed border-line rounded-[10px] bg-bg px-4 py-5 flex items-center gap-3"
        >
          <span className="font-mono text-[11px] font-bold text-fg-subtle tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-[13px] text-fg-muted font-medium">{label}</span>
        </div>
      ))}
    </div>
  )
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return iso
  }
}
