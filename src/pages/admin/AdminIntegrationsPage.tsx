import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BellRing,
  Briefcase,
  Database,
  Github,
  MessageSquare,
  PencilLine,
  Play,
  Plug,
  Plus,
  Power,
  Search,
  Trash2,
  Users,
  Webhook,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Integration, IntegrationKind, IntegrationStatus } from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useIntegrations } from '@/hooks/useIntegrations'
import {
  createIntegration,
  deleteIntegration,
  disableIntegration,
  enableIntegration,
  testIntegration,
  updateIntegration,
} from '@/mock/integrations'
import { LoadingState } from '@/components/state/LoadingState'
import { ErrorState } from '@/components/state/ErrorState'
import { EmptyState } from '@/components/state/EmptyState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

type KindFilter = IntegrationKind | 'all'
type StatusFilter = IntegrationStatus | 'all'

const KIND_LABEL: Record<IntegrationKind, string> = {
  dce: 'DCE',
  crm: 'CRM',
  hr: 'HR',
  github: 'GitHub',
  feishu: 'Feishu',
  webhook: 'Webhook',
  pagerduty: 'PagerDuty',
}

const KIND_ICON: Record<IntegrationKind, LucideIcon> = {
  dce: Database,
  crm: Users,
  hr: Briefcase,
  github: Github,
  feishu: MessageSquare,
  webhook: Webhook,
  pagerduty: BellRing,
}

const KIND_TONE: Record<IntegrationKind, string> = {
  dce: 'text-[#1d4ed8] bg-[#dbeafe] border-[#bfdbfe]',
  crm: 'text-[#6d28d9] bg-[#ede9fe] border-[#ddd6fe]',
  hr: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  github: 'text-fg bg-bg border-line',
  feishu: 'text-[#0891b2] bg-[#cffafe] border-[#a5f3fc]',
  webhook: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  pagerduty: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
}

const STATUS_TONE: Record<IntegrationStatus, string> = {
  connected: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  error: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
  disabled: 'text-fg-muted bg-bg border-line',
}

const KIND_ORDER: IntegrationKind[] = [
  'dce',
  'crm',
  'hr',
  'github',
  'feishu',
  'webhook',
  'pagerduty',
]

type FormState = {
  name: string
  kind: IntegrationKind
  endpoint: string
  note: string
}

const BLANK_FORM: FormState = {
  name: '',
  kind: 'webhook',
  endpoint: '',
  note: '',
}

type EditorMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; id: string }

export default function AdminIntegrationsPage() {
  const { data: me } = useCurrentUser()
  const [kind, setKind] = useState<KindFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorMode>({ kind: 'closed' })
  const [toDelete, setToDelete] = useState<Integration | null>(null)

  const query = useMemo(
    () => ({
      kind: kind === 'all' ? undefined : kind,
      status: status === 'all' ? undefined : status,
      search: search.trim() || undefined,
      sort: 'updatedAt-desc' as const,
    }),
    [kind, status, search],
  )

  const { data, loading, error, refresh } = useIntegrations(query)
  const rows = data?.items ?? []

  const summary = useMemo(() => {
    const s = { total: rows.length, connected: 0, errors: 0 }
    for (const i of rows) {
      if (i.status === 'connected') s.connected++
      if (i.status === 'error') s.errors++
    }
    return s
  }, [rows])

  const editing = useMemo(() => {
    if (editor.kind !== 'edit') return null
    return rows.find((i) => i.id === editor.id) ?? null
  }, [editor, rows])

  async function runAction(
    id: string,
    fn: () => Promise<unknown>,
  ): Promise<boolean> {
    setBusyId(id)
    setActionError(null)
    try {
      await fn()
      refresh()
      return true
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e))
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function onTest(id: string) {
    await runAction(id, () => testIntegration(id))
  }

  async function onToggleDisabled(i: Integration) {
    if (i.status === 'disabled') {
      await runAction(i.id, () => enableIntegration(i.id))
    } else {
      await runAction(i.id, () => disableIntegration(i.id))
    }
  }

  async function onDelete() {
    if (!toDelete) return
    const ok = await runAction(toDelete.id, () => deleteIntegration(toDelete.id))
    if (ok) setToDelete(null)
  }

  async function onSubmit(form: FormState) {
    setActionError(null)
    try {
      if (editor.kind === 'create') {
        if (!me) throw new Error('Cannot create integration without a signed-in user')
        await createIntegration({
          tenantId: me.tenantId,
          name: form.name.trim(),
          kind: form.kind,
          endpoint: form.endpoint.trim() || undefined,
          note: form.note.trim() || undefined,
        })
      } else if (editor.kind === 'edit') {
        await updateIntegration(editor.id, {
          name: form.name.trim(),
          kind: form.kind,
          endpoint: form.endpoint.trim() || undefined,
          note: form.note.trim() || undefined,
        })
      }
      setEditor({ kind: 'closed' })
      refresh()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-extrabold text-fg">Tenant integrations</h2>
            <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[520px]">
              Upstream systems that expose capabilities to apps. Test, disable,
              or remove links here.
            </p>
          </div>
          <button
            onClick={() => setEditor({ kind: 'create' })}
            className="inline-flex items-center gap-[6px] px-[14px] py-[8px] rounded-[8px] bg-accent text-white text-[13px] font-semibold hover:bg-accent-strong transition-colors shrink-0"
          >
            <Plus size={14} />
            New integration
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Total" value={summary.total} tone="text-fg" />
          <StatTile label="Connected" value={summary.connected} tone="text-[#047857]" />
          <StatTile label="Errors" value={summary.errors} tone="text-[#b91c1c]" />
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-[14px] flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Kind"
          value={kind}
          onChange={(v) => setKind(v as KindFilter)}
          options={[
            { value: 'all', label: 'All' },
            ...KIND_ORDER.map((k) => ({ value: k, label: KIND_LABEL[k] })),
          ]}
        />
        <FilterGroup
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'connected', label: 'Connected' },
            { value: 'error', label: 'Error' },
            { value: 'disabled', label: 'Disabled' },
          ]}
        />
        <label className="ml-auto relative flex items-center min-w-[220px]">
          <Search size={13} className="absolute left-[10px] text-fg-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, endpoint, note…"
            className="w-full pl-[30px] pr-3 py-[7px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle"
          />
        </label>
      </section>

      {actionError && (
        <div className="px-4 py-3 bg-[#fef2f2] border border-[#fecaca] rounded-[9px] text-[13px] text-[#b91c1c] flex items-start justify-between gap-3">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            aria-label="Dismiss"
            className="shrink-0 text-[#b91c1c] hover:text-[#7f1d1d]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && rows.length === 0 ? (
        <LoadingState label="Loading integrations…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Plug}
          message="No integrations match"
          hint="Clear filters or create a new integration."
        />
      ) : (
        <section className="bg-card border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((i) => (
              <IntegrationRow
                key={i.id}
                integration={i}
                busy={busyId === i.id}
                onTest={() => onTest(i.id)}
                onToggleDisabled={() => onToggleDisabled(i)}
                onEdit={() => setEditor({ kind: 'edit', id: i.id })}
                onDelete={() => setToDelete(i)}
              />
            ))}
          </ul>
        </section>
      )}

      <AnimatePresence>
        {editor.kind !== 'closed' && (
          <EditorModal
            key={editor.kind === 'edit' ? editor.id : 'create'}
            mode={editor.kind}
            initial={
              editing
                ? {
                    name: editing.name,
                    kind: editing.kind,
                    endpoint: editing.endpoint ?? '',
                    note: editing.note ?? '',
                  }
                : BLANK_FORM
            }
            onClose={() => setEditor({ kind: 'closed' })}
            onSubmit={onSubmit}
          />
        )}
        {toDelete && (
          <DeleteModal
            integration={toDelete}
            onClose={() => setToDelete(null)}
            onConfirm={onDelete}
            busy={busyId === toDelete.id}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function IntegrationRow(props: {
  integration: Integration
  busy: boolean
  onTest: () => void
  onToggleDisabled: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { integration: i, busy, onTest, onToggleDisabled, onEdit, onDelete } = props
  const Icon = KIND_ICON[i.kind]
  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className={`w-10 h-10 rounded-[9px] border flex items-center justify-center shrink-0 ${KIND_TONE[i.kind]}`}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-fg">{i.name}</span>
            <span
              className={`inline-flex items-center px-[9px] py-[3px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider ${STATUS_TONE[i.status]}`}
            >
              {i.status}
            </span>
            <span
              className={`inline-flex items-center px-[8px] py-[2px] rounded-[6px] border font-mono text-[10px] font-semibold uppercase tracking-wider ${KIND_TONE[i.kind]}`}
            >
              {KIND_LABEL[i.kind]}
            </span>
          </div>
          {i.endpoint && (
            <div className="font-mono text-[11.5px] text-fg-muted mt-[3px] truncate">
              {i.endpoint}
            </div>
          )}
          {i.note && (
            <p className="text-[12.5px] text-fg-muted mt-[4px]">{i.note}</p>
          )}
          {i.status === 'error' && i.lastError && (
            <div className="mt-[6px] px-[9px] py-[6px] bg-[#fef2f2] border border-[#fecaca] rounded-[7px] text-[12px] text-[#b91c1c] font-mono">
              {i.lastError}
            </div>
          )}
          <div className="font-mono text-[10.5px] text-fg-subtle mt-[8px] uppercase tracking-wider flex items-center gap-[6px] flex-wrap">
            <span>{i.id}</span>
            {i.lastCheckedAt && (
              <>
                <span className="text-line">·</span>
                <span title={absoluteTime(i.lastCheckedAt)}>
                  Checked <RelativeTime iso={i.lastCheckedAt} />
                </span>
              </>
            )}
            <span className="text-line">·</span>
            <span title={absoluteTime(i.updatedAt)}>
              Updated <RelativeTime iso={i.updatedAt} />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-[6px] shrink-0 flex-wrap">
          <RowButton
            onClick={onTest}
            disabled={busy || i.status === 'disabled'}
            icon={Play}
            label="Test"
          />
          <RowButton
            onClick={onToggleDisabled}
            disabled={busy}
            icon={Power}
            label={i.status === 'disabled' ? 'Enable' : 'Disable'}
          />
          <RowButton onClick={onEdit} disabled={busy} icon={PencilLine} label="Edit" />
          <RowButton
            onClick={onDelete}
            disabled={busy}
            icon={Trash2}
            label="Delete"
            tone="danger"
          />
        </div>
      </div>
    </li>
  )
}

function RowButton(props: {
  onClick: () => void
  disabled: boolean
  icon: LucideIcon
  label: string
  tone?: 'default' | 'danger'
}) {
  const { onClick, disabled, icon: Icon, label, tone = 'default' } = props
  const toneCls =
    tone === 'danger'
      ? 'text-[#b91c1c] hover:bg-[#fef2f2] hover:border-[#fecaca]'
      : 'text-fg-muted hover:text-fg hover:bg-bg'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-[5px] px-[9px] py-[5px] rounded-[7px] border border-line text-[12px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${toneCls}`}
    >
      <Icon size={12} strokeWidth={2} />
      {label}
    </button>
  )
}

function EditorModal(props: {
  mode: 'create' | 'edit'
  initial: FormState
  onClose: () => void
  onSubmit: (form: FormState) => void | Promise<void>
}) {
  const { mode, initial, onClose, onSubmit } = props
  const [form, setForm] = useState<FormState>(initial)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = form.name.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell
      title={mode === 'create' ? 'New integration' : 'Edit integration'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name">
          <input
            autoFocus
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Prod DCE"
            className="w-full px-3 py-[8px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle"
          />
        </Field>
        <Field label="Kind">
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as IntegrationKind })}
            className="w-full px-3 py-[8px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Endpoint">
          <input
            type="text"
            value={form.endpoint}
            onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
            placeholder="https://…"
            className="w-full px-3 py-[8px] text-[13px] font-mono bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle"
          />
        </Field>
        <Field label="Note">
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={3}
            placeholder="Owner, rotation, escalation…"
            className="w-full px-3 py-[8px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle resize-none"
          />
        </Field>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-[14px] py-[8px] text-[13px] font-semibold text-fg-muted hover:text-fg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-[14px] py-[8px] text-[13px] font-semibold rounded-[8px] bg-accent text-white hover:bg-accent-strong transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {mode === 'create' ? 'Create' : 'Save changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function DeleteModal(props: {
  integration: Integration
  onClose: () => void
  onConfirm: () => void
  busy: boolean
}) {
  const { integration, onClose, onConfirm, busy } = props
  return (
    <ModalShell title="Delete integration?" onClose={onClose}>
      <p className="text-[13px] text-fg-muted">
        Apps relying on{' '}
        <span className="font-semibold text-fg">{integration.name}</span> will
        lose access to its capabilities. This cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-2 pt-5">
        <button
          onClick={onClose}
          className="px-[14px] py-[8px] text-[13px] font-semibold text-fg-muted hover:text-fg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="px-[14px] py-[8px] text-[13px] font-semibold rounded-[8px] bg-[#b91c1c] text-white hover:bg-[#991b1b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Delete
        </button>
      </div>
    </ModalShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] text-fg-subtle uppercase tracking-wider mb-[6px]">
        {label}
      </span>
      {children}
    </label>
  )
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.16 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] bg-card border border-line rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.18)] p-6"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-[15px] font-extrabold text-fg">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-bg border border-line rounded-[9px] px-4 py-3">
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-[20px] font-extrabold mt-[2px] ${tone}`}>{value}</div>
    </div>
  )
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </span>
      <div className="inline-flex bg-bg border border-line rounded-[8px] p-[2px] flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-[10px] py-[5px] text-[12px] font-semibold rounded-[6px] transition-colors ${
              value === opt.value
                ? 'bg-card text-accent shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
