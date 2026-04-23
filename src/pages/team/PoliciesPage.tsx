import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Ban,
  Database,
  DollarSign,
  Globe,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { Policy, PolicyAction, PolicyKind, User } from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { usePolicies } from '@/hooks/usePolicies'
import {
  createPolicy,
  deletePolicy,
  updatePolicy,
} from '@/mock/policies'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

type KindFilter = PolicyKind | 'all'
type ActionFilter = PolicyAction | 'all'

const KIND_META: Record<PolicyKind, { label: string; Icon: LucideIcon; tone: string }> = {
  data: {
    label: 'Data',
    Icon: Database,
    tone: 'text-[#1d4ed8] bg-[#dbeafe] border-[#bfdbfe]',
  },
  egress: {
    label: 'Egress',
    Icon: Globe,
    tone: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  },
  cost: {
    label: 'Cost',
    Icon: DollarSign,
    tone: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  },
}

const ACTION_META: Record<PolicyAction, { label: string; Icon: LucideIcon; tone: string }> = {
  warn: {
    label: 'Warn',
    Icon: TriangleAlert,
    tone: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
  },
  block: {
    label: 'Block',
    Icon: Ban,
    tone: 'text-[#b91c1c] bg-[#fee2e2] border-[#fecaca]',
  },
}

function canManage(u: User | undefined): boolean {
  if (!u) return false
  return u.roles.includes('admin') || u.roles.includes('team-manager')
}

export default function PoliciesPage() {
  const { data: user } = useCurrentUser()
  const manage = canManage(user)

  const [kind, setKind] = useState<KindFilter>('all')
  const [action, setAction] = useState<ActionFilter>('all')
  const [search, setSearch] = useState('')

  const query = useMemo(
    () => ({
      tenantId: user?.tenantId,
      kind: kind === 'all' ? undefined : kind,
      action: action === 'all' ? undefined : action,
      search: search.trim() || undefined,
      sort: 'updatedAt-desc' as const,
    }),
    [user?.tenantId, kind, action, search],
  )

  const { data, loading, error, refresh } = usePolicies(query)
  const rows = data?.items ?? []

  const [editTarget, setEditTarget] = useState<Policy | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null)

  const summary = useMemo(() => {
    let warn = 0
    let block = 0
    for (const p of rows) {
      if (p.action === 'warn') warn++
      else if (p.action === 'block') block++
    }
    return { total: rows.length, warn, block }
  }, [rows])

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-extrabold text-fg">Policies</h2>
            <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[520px]">
              Rules evaluated before every generate, deploy, and execution.{' '}
              {manage
                ? 'Adjust thresholds and add new checks as the team grows.'
                : 'Only team managers and admins can change policies.'}
            </p>
          </div>
          {manage && (
            <button
              onClick={() => setCreateOpen(true)}
              disabled={!user}
              className="inline-flex items-center gap-[6px] px-3 py-[8px] bg-accent text-white text-[13px] font-semibold rounded-[8px] hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={14} strokeWidth={2.5} />
              New policy
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatTile label="Total" value={summary.total} tone="text-fg" />
          <StatTile label="Warn" value={summary.warn} tone="text-[#b45309]" />
          <StatTile label="Block" value={summary.block} tone="text-[#b91c1c]" />
        </div>
      </section>

      <section className="bg-card border border-line rounded-xl p-[14px] flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Kind"
          value={kind}
          onChange={(v) => setKind(v as KindFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'data', label: 'Data' },
            { value: 'egress', label: 'Egress' },
            { value: 'cost', label: 'Cost' },
          ]}
        />
        <FilterGroup
          label="Action"
          value={action}
          onChange={(v) => setAction(v as ActionFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'warn', label: 'Warn' },
            { value: 'block', label: 'Block' },
          ]}
        />
        <label className="ml-auto relative flex items-center min-w-[200px]">
          <Search size={13} className="absolute left-[10px] text-fg-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search label or rule…"
            className="w-full pl-[30px] pr-3 py-[7px] text-[13px] bg-bg border border-line rounded-[8px] focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-fg-subtle"
          />
        </label>
      </section>

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && rows.length === 0 ? (
        <LoadingState label="Loading policies…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          message="No policies match"
          hint={
            kind !== 'all' || action !== 'all' || search
              ? 'Clear filters or adjust the search.'
              : 'Add your first rule to protect the team.'
          }
          ctaLabel={manage ? 'New policy →' : undefined}
          onCta={manage ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <section className="bg-card border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((p) => (
              <PolicyRow
                key={p.id}
                policy={p}
                manage={manage}
                onEdit={() => setEditTarget(p)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </ul>
        </section>
      )}

      <AnimatePresence>
        {createOpen && user && (
          <PolicyModal
            mode="create"
            tenantId={user.tenantId}
            onClose={() => setCreateOpen(false)}
            onDone={() => {
              setCreateOpen(false)
              refresh()
            }}
          />
        )}
        {editTarget && (
          <PolicyModal
            mode="edit"
            policy={editTarget}
            tenantId={editTarget.tenantId}
            onClose={() => setEditTarget(null)}
            onDone={() => {
              setEditTarget(null)
              refresh()
            }}
          />
        )}
        {deleteTarget && (
          <DeletePolicyModal
            policy={deleteTarget}
            onCancel={() => setDeleteTarget(null)}
            onDone={() => {
              setDeleteTarget(null)
              refresh()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="bg-bg border border-line rounded-[9px] px-4 py-3">
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-[20px] font-extrabold mt-[2px] ${tone}`}>
        {value}
      </div>
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
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </span>
      <div className="inline-flex bg-bg border border-line rounded-[8px] p-[2px]">
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

function PolicyRow(props: {
  policy: Policy
  manage: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const { policy, manage, onEdit, onDelete } = props
  const kindMeta = KIND_META[policy.kind]
  const actionMeta = ACTION_META[policy.action]
  const KIcon = kindMeta.Icon
  const AIcon = actionMeta.Icon
  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="flex items-center gap-2 shrink-0 min-w-[90px]">
          <span
            className={`inline-flex items-center gap-[5px] px-[9px] py-[4px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider ${kindMeta.tone}`}
          >
            <KIcon size={11} strokeWidth={2} />
            {kindMeta.label}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-fg">{policy.label}</div>
          <div className="font-mono text-[12px] text-fg-muted mt-1 bg-bg border border-line rounded-[6px] px-[8px] py-[5px] break-all">
            {policy.rule}
          </div>
          <div
            className="font-mono text-[10.5px] text-fg-subtle mt-[6px] uppercase tracking-wider"
            title={absoluteTime(policy.updatedAt)}
          >
            Updated <RelativeTime iso={policy.updatedAt} />
            <span className="mx-[6px] text-line">·</span>
            <span>{policy.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-[5px] px-[9px] py-[4px] rounded-[7px] border font-mono text-[11px] font-semibold uppercase tracking-wider ${actionMeta.tone}`}
          >
            <AIcon size={11} strokeWidth={2} />
            {actionMeta.label}
          </span>
          {manage && (
            <>
              <button
                onClick={onEdit}
                aria-label={`Edit ${policy.label}`}
                className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                aria-label={`Delete ${policy.label}`}
                className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center text-fg-subtle hover:bg-[#fef2f2] hover:text-[#b91c1c] transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}

type PolicyModalProps =
  | {
      mode: 'create'
      tenantId: string
      policy?: undefined
      onClose: () => void
      onDone: () => void
    }
  | {
      mode: 'edit'
      tenantId: string
      policy: Policy
      onClose: () => void
      onDone: () => void
    }

function PolicyModal(props: PolicyModalProps) {
  const editing = props.mode === 'edit'
  const [kind, setKind] = useState<PolicyKind>(
    editing ? props.policy.kind : 'data',
  )
  const [label, setLabel] = useState(editing ? props.policy.label : '')
  const [rule, setRule] = useState(editing ? props.policy.rule : '')
  const [action, setAction] = useState<PolicyAction>(
    editing ? props.policy.action : 'warn',
  )
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const valid = label.trim().length > 0 && rule.trim().length > 0

  async function submit() {
    if (!valid) return
    setSubmitting(true)
    setErr(null)
    try {
      if (editing) {
        await updatePolicy(props.policy.id, {
          kind,
          label: label.trim(),
          rule: rule.trim(),
          action,
        })
      } else {
        await createPolicy({
          tenantId: props.tenantId,
          kind,
          label: label.trim(),
          rule: rule.trim(),
          action,
        })
      }
      props.onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <ModalShell
      title={editing ? 'Edit policy' : 'New policy'}
      onClose={props.onClose}
    >
      <div className="space-y-4">
        <Field label="Kind">
          <div className="inline-flex bg-bg border border-line rounded-[8px] p-[2px]">
            {(['data', 'egress', 'cost'] as PolicyKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                disabled={submitting}
                className={`px-[12px] py-[6px] text-[12px] font-semibold rounded-[6px] capitalize transition-colors ${
                  kind === k
                    ? 'bg-card text-accent shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Label">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={submitting}
            placeholder="Block raw PII in outbound requests"
            className="w-full text-[13px] px-3 py-[8px] rounded-[8px] border border-line bg-card focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
          />
        </Field>
        <Field label="Rule">
          <textarea
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            disabled={submitting}
            rows={3}
            placeholder='egress.domain == "*.public.api"'
            className="w-full font-mono text-[12.5px] px-3 py-[8px] rounded-[8px] border border-line bg-bg focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60 resize-none"
          />
        </Field>
        <Field label="Action">
          <div className="inline-flex bg-bg border border-line rounded-[8px] p-[2px]">
            {(['warn', 'block'] as PolicyAction[]).map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                disabled={submitting}
                className={`px-[12px] py-[6px] text-[12px] font-semibold rounded-[6px] capitalize transition-colors ${
                  action === a
                    ? 'bg-card text-accent shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Field>
      </div>
      {err && <div className="mt-3 text-[13px] text-[#b91c1c]">{err}</div>}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          onClick={props.onClose}
          disabled={submitting}
          className="px-3 py-[7px] text-[13px] font-semibold text-fg-muted rounded-[8px] hover:bg-line-soft transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting || !valid}
          className="px-3 py-[7px] bg-accent text-white text-[13px] font-semibold rounded-[8px] hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {submitting
            ? editing
              ? 'Saving…'
              : 'Creating…'
            : editing
              ? 'Save'
              : 'Create'}
        </button>
      </div>
    </ModalShell>
  )
}

function DeletePolicyModal(props: {
  policy: Policy
  onCancel: () => void
  onDone: () => void
}) {
  const { policy, onCancel, onDone } = props
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setErr(null)
    try {
      await deletePolicy(policy.id)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Delete policy" onClose={onCancel}>
      <p className="text-[13px] text-fg-muted">
        Delete <span className="text-fg font-semibold">{policy.label}</span>?
        This removes the rule from the enforcement pipeline. Past audit events
        referencing it stay intact.
      </p>
      {err && <div className="mt-3 text-[13px] text-[#b91c1c]">{err}</div>}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-[7px] text-[13px] font-semibold text-fg-muted rounded-[8px] hover:bg-line-soft transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-3 py-[7px] bg-[#b91c1c] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#991b1b] disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </ModalShell>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
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
