import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  Copy,
  Key,
  Plus,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import type { ApiToken } from '@/types'
import { useApiTokens } from '@/hooks/useApiTokens'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  createApiToken,
  revokeApiToken,
  tokenStatus,
  type ApiTokenStatus,
  type CreateApiTokenResult,
} from '@/mock/apiTokens'
import { LoadingState } from '@/components/state/LoadingState'
import { EmptyState } from '@/components/state/EmptyState'
import { ErrorState } from '@/components/state/ErrorState'
import { RelativeTime, absoluteTime } from '@/components/RelativeTime'

const SCOPE_OPTIONS: string[] = [
  'apps:read',
  'apps:write',
  'sessions:read',
  'sessions:write',
  'executions:read',
  'executions:write',
  'capabilities:read',
  'notifications:read',
]

const STATUS_BADGE: Record<ApiTokenStatus, string> = {
  active: 'text-[#047857] bg-[#d1fae5] border-[#a7f3d0]',
  revoked: 'text-fg-muted bg-line-soft border-line',
  expired: 'text-[#b45309] bg-[#fef3c7] border-[#fde68a]',
}

export default function SettingsTokensPage() {
  const { data: user } = useCurrentUser()
  const { data, loading, error, refresh } = useApiTokens({
    ownerId: user?.id,
    sort: 'createdAt-desc',
  })
  const tokens = data?.items ?? []

  const [createOpen, setCreateOpen] = useState(false)
  const [created, setCreated] = useState<CreateApiTokenResult | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<ApiToken | null>(null)

  const summary = useMemo(() => {
    let active = 0
    let revoked = 0
    let expired = 0
    for (const t of tokens) {
      const s = tokenStatus(t)
      if (s === 'active') active++
      else if (s === 'revoked') revoked++
      else expired++
    }
    return { active, revoked, expired }
  }, [tokens])

  return (
    <div className="space-y-6">
      <section className="bg-card border border-line rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[14px] font-extrabold text-fg">API tokens</h2>
            <p className="text-[12.5px] text-fg-muted mt-[3px] max-w-[520px]">
              Personal access tokens scoped to your identity. CLI and CI use these to call
              Forge. A token is shown in plaintext once at creation — treat them like
              passwords.
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            disabled={!user}
            className="inline-flex items-center gap-[6px] px-3 py-[8px] bg-accent text-white text-[13px] font-semibold rounded-[8px] hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            New token
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <SummaryTile label="Active" value={summary.active} tone="text-[#047857]" />
          <SummaryTile label="Revoked" value={summary.revoked} tone="text-fg-muted" />
          <SummaryTile label="Expired" value={summary.expired} tone="text-[#b45309]" />
        </div>
      </section>

      {error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : loading && tokens.length === 0 ? (
        <LoadingState label="Loading tokens…" />
      ) : tokens.length === 0 ? (
        <EmptyState
          icon={Key}
          message="No API tokens yet"
          hint="Create one for your CLI, CI pipeline, or script."
          ctaLabel="Create a token →"
          onCta={() => setCreateOpen(true)}
        />
      ) : (
        <section className="bg-card border border-line rounded-xl overflow-hidden">
          <ul className="divide-y divide-line">
            {tokens.map((t) => (
              <TokenRow key={t.id} token={t} onRevoke={() => setRevokeTarget(t)} />
            ))}
          </ul>
        </section>
      )}

      <AnimatePresence>
        {createOpen && user && !created && (
          <CreateTokenModal
            ownerId={user.id}
            onClose={() => setCreateOpen(false)}
            onCreated={(res) => {
              setCreated(res)
              refresh()
            }}
          />
        )}
        {created && (
          <PlaintextModal
            result={created}
            onDone={() => {
              setCreated(null)
              setCreateOpen(false)
            }}
          />
        )}
        {revokeTarget && (
          <RevokeModal
            token={revokeTarget}
            onCancel={() => setRevokeTarget(null)}
            onDone={() => {
              setRevokeTarget(null)
              refresh()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-bg border border-line rounded-[9px] px-4 py-3">
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-[22px] font-black leading-none mt-[6px] ${tone}`}>{value}</div>
    </div>
  )
}

function TokenRow({ token, onRevoke }: { token: ApiToken; onRevoke: () => void }) {
  const status = tokenStatus(token)
  const isActive = status === 'active'
  return (
    <li className="px-6 py-4 flex items-start gap-4">
      <div className="w-[32px] h-[32px] rounded-[8px] bg-bg border border-line flex items-center justify-center shrink-0">
        <Key size={14} className="text-fg-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-bold text-fg">{token.label}</span>
          <span
            className={`font-mono text-[10px] px-[6px] py-[1px] rounded-[5px] border uppercase tracking-wider font-bold ${STATUS_BADGE[status]}`}
          >
            {status}
          </span>
        </div>
        <div className="font-mono text-[12px] text-fg-subtle mt-[4px]">
          {token.prefix}
          <span className="mx-1 text-line">·</span>
          {token.id}
        </div>
        <div className="font-mono text-[10.5px] text-fg-subtle mt-[5px] flex items-center gap-3 flex-wrap">
          <span>
            Created <RelativeTime iso={token.createdAt} />
          </span>
          <span>·</span>
          <span>
            Last used{' '}
            {token.lastUsedAt ? <RelativeTime iso={token.lastUsedAt} /> : 'never'}
          </span>
          {token.expiresAt && (
            <>
              <span>·</span>
              <span title={absoluteTime(token.expiresAt)}>
                {status === 'expired' ? 'Expired ' : 'Expires '}
                <RelativeTime iso={token.expiresAt} />
              </span>
            </>
          )}
          {token.revokedAt && (
            <>
              <span>·</span>
              <span>
                Revoked <RelativeTime iso={token.revokedAt} />
              </span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-[5px] mt-[8px]">
          {token.scopes.map((s) => (
            <span
              key={s}
              className="font-mono text-[10.5px] px-[6px] py-[2px] rounded-[5px] bg-bg border border-line text-fg-muted"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="shrink-0">
        <button
          onClick={onRevoke}
          disabled={!isActive}
          className="inline-flex items-center gap-[5px] px-[10px] py-[6px] text-[12px] font-semibold rounded-[7px] border border-line text-fg-muted hover:text-[#b91c1c] hover:border-[#fecaca] hover:bg-[#fee2e2]/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-fg-muted disabled:hover:border-line disabled:hover:bg-transparent transition-colors"
        >
          <Trash2 size={12} strokeWidth={2} />
          Revoke
        </button>
      </div>
    </li>
  )
}

function CreateTokenModal({
  ownerId,
  onClose,
  onCreated,
}: {
  ownerId: string
  onClose: () => void
  onCreated: (r: CreateApiTokenResult) => void
}) {
  const [label, setLabel] = useState('')
  const [scopes, setScopes] = useState<string[]>(['apps:read'])
  const [expiryDays, setExpiryDays] = useState<string>('90')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const toggleScope = (s: string) => {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const submit = async () => {
    if (!label.trim()) {
      setErr('Label is required')
      return
    }
    if (scopes.length === 0) {
      setErr('Pick at least one scope')
      return
    }
    setSubmitting(true)
    setErr(null)
    try {
      const days = expiryDays ? Number(expiryDays) : NaN
      const expiresAt =
        Number.isFinite(days) && days > 0
          ? new Date(Date.now() + days * 86_400_000).toISOString()
          : undefined
      const result = await createApiToken({
        ownerId,
        label: label.trim(),
        scopes,
        expiresAt,
      })
      onCreated(result)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="text-[18px] font-extrabold text-fg leading-tight">New API token</div>
          <div className="text-[12.5px] text-fg-muted mt-1">
            Pick the smallest scope set that gets the job done.
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-[7px] flex items-center justify-center text-fg-subtle hover:bg-line-soft hover:text-fg"
          aria-label="Close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider mb-[5px]">
            Label
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. CLI on laptop"
            autoFocus
            className="w-full px-3 py-[9px] bg-bg border border-line rounded-[8px] text-[13px] outline-none focus:border-accent transition-colors"
          />
        </label>

        <div>
          <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider mb-[6px]">
            Scopes
          </div>
          <div className="grid grid-cols-2 gap-[6px]">
            {SCOPE_OPTIONS.map((s) => {
              const checked = scopes.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleScope(s)}
                  className={`flex items-center gap-2 px-3 py-[7px] rounded-[7px] border font-mono text-[11.5px] text-left transition-colors ${
                    checked
                      ? 'bg-accent-ultra border-accent text-accent font-bold'
                      : 'bg-bg border-line text-fg-muted hover:border-fg-subtle'
                  }`}
                >
                  <span
                    className={`w-[14px] h-[14px] rounded-[4px] border flex items-center justify-center shrink-0 ${
                      checked ? 'bg-accent border-accent' : 'border-line'
                    }`}
                  >
                    {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <label className="block">
          <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider mb-[5px]">
            Expires in (days)
          </div>
          <input
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="Leave blank for no expiry"
            className="w-full px-3 py-[9px] bg-bg border border-line rounded-[8px] text-[13px] outline-none focus:border-accent transition-colors"
          />
        </label>

        {err && (
          <div className="bg-[#fee2e2] border border-[#fecaca] rounded-[8px] px-3 py-2 text-[12.5px] text-[#b91c1c] font-medium">
            {err}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          disabled={submitting}
          className="px-3 py-[8px] text-[12.5px] font-semibold text-fg-muted border border-line rounded-[7px] hover:bg-line-soft disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-3 py-[8px] text-[12.5px] font-semibold bg-accent text-white rounded-[7px] hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Creating…' : 'Create token'}
        </button>
      </div>
    </ModalShell>
  )
}

function PlaintextModal({
  result,
  onDone,
}: {
  result: CreateApiTokenResult
  onDone: () => void
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.plaintext)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }
  return (
    <ModalShell onClose={onDone} wide>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#fef3c7] border border-[#fde68a] flex items-center justify-center shrink-0">
          <Shield size={18} className="text-[#92400e]" />
        </div>
        <div className="min-w-0">
          <div className="text-[17px] font-extrabold text-fg leading-tight">
            Copy this token now
          </div>
          <div className="text-[12.5px] text-fg-muted mt-1 leading-[1.5]">
            This is the only time Forge will show the plaintext. Store it in your secrets
            manager — we can't retrieve it again.
          </div>
        </div>
      </div>

      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[10px] p-3 mb-4 flex items-start gap-3">
        <div className="font-mono text-[12.5px] text-fg break-all flex-1 leading-[1.5]">
          {result.plaintext}
        </div>
        <button
          onClick={copy}
          className="shrink-0 inline-flex items-center gap-[5px] px-[10px] py-[6px] text-[12px] font-semibold bg-card border border-line rounded-[7px] hover:border-accent hover:text-accent transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} strokeWidth={3} /> Copied
            </>
          ) : (
            <>
              <Copy size={12} /> Copy
            </>
          )}
        </button>
      </div>

      <div className="bg-bg border border-line rounded-[10px] p-3 mb-5 grid grid-cols-2 gap-3">
        <InfoCell label="Label" value={result.token.label} />
        <InfoCell label="Token id" value={result.token.id} mono />
        <InfoCell label="Prefix" value={result.token.prefix} mono />
        <InfoCell
          label="Expires"
          value={result.token.expiresAt ? absoluteTime(result.token.expiresAt) : 'never'}
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={onDone}
          className="px-3 py-[8px] text-[12.5px] font-semibold bg-accent text-white rounded-[7px] hover:bg-accent/90 transition-colors"
        >
          I've saved it
        </button>
      </div>
    </ModalShell>
  )
}

function RevokeModal({
  token,
  onCancel,
  onDone,
}: {
  token: ApiToken
  onCancel: () => void
  onDone: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const submit = async () => {
    setSubmitting(true)
    setErr(null)
    try {
      await revokeApiToken(token.id)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <ModalShell onClose={onCancel}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#fee2e2] border border-[#fecaca] flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-[#b91c1c]" />
        </div>
        <div className="min-w-0">
          <div className="text-[16px] font-extrabold text-fg leading-tight">
            Revoke "{token.label}"?
          </div>
          <div className="text-[12.5px] text-fg-muted mt-1 leading-[1.5]">
            Any CLI, CI pipeline, or script using this token will start getting 401s
            immediately. This cannot be undone — you'll need to mint a new token to restore
            access.
          </div>
        </div>
      </div>

      <div className="bg-bg border border-line rounded-[9px] p-3 mb-4 font-mono text-[12px] text-fg">
        {token.prefix}
        <span className="mx-1 text-line">·</span>
        <span className="text-fg-subtle">{token.id}</span>
      </div>

      {err && (
        <div className="bg-[#fee2e2] border border-[#fecaca] rounded-[8px] px-3 py-2 mb-3 text-[12.5px] text-[#b91c1c] font-medium">
          {err}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-[8px] text-[12.5px] font-semibold text-fg-muted border border-line rounded-[7px] hover:bg-line-soft disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-3 py-[8px] text-[12.5px] font-semibold bg-[#b91c1c] text-white rounded-[7px] hover:bg-[#991b1b] disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Revoking…' : 'Revoke token'}
        </button>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-card rounded-[14px] shadow-2xl w-full p-6 ${wide ? 'max-w-[560px]' : 'max-w-[480px]'}`}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] text-fg-subtle uppercase tracking-wider mb-[3px]">
        {label}
      </div>
      <div className={`text-[12.5px] text-fg truncate ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </div>
    </div>
  )
}
