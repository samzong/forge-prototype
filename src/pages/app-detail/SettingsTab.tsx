import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Trash2, AlertTriangle, Shield, Users } from 'lucide-react'
import type { App } from '@/types'
import { updateApp, deleteApp } from '@/mock/apps'
import { InfoPanel } from './shared'

interface Props {
  app: App
}

export function SettingsTab({ app }: Props) {
  const navigate = useNavigate()
  const [name, setName] = useState(app.name)
  const [description, setDescription] = useState(app.description)
  const [icon, setIcon] = useState(app.icon)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setName(app.name)
    setDescription(app.description)
    setIcon(app.icon)
  }, [app.name, app.description, app.icon])

  const dirty = name !== app.name || description !== app.description || icon !== app.icon

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveMessage(null)
    try {
      await updateApp(app.id, { name, description, icon })
      setSaveMessage('Saved.')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const runDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteApp(app.id)
      navigate('/apps')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : String(e))
      setDeleting(false)
    }
  }

  return (
    <div
      className="px-8 py-6 max-w-[880px] mx-auto grid gap-5"
      style={{ gridTemplateColumns: '1fr 280px' }}
    >
      <div className="space-y-5">
        <Section title="Profile">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-[8px] bg-bg border border-line rounded-[9px] text-[13px] outline-none focus:border-accent transition-colors"
            />
          </Field>
          <Field label="Icon (2–3 chars)">
            <input
              value={icon}
              maxLength={4}
              onChange={(e) => setIcon(e.target.value)}
              className="w-[120px] px-3 py-[8px] bg-bg border border-line rounded-[9px] text-[13px] font-mono outline-none focus:border-accent transition-colors"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-[8px] bg-bg border border-line rounded-[9px] text-[13px] outline-none focus:border-accent transition-colors resize-none"
            />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="px-[14px] py-[9px] bg-accent text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#1d4ed8] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <Save size={13} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saveMessage && (
              <span className="text-[12px] text-[#10b981] font-semibold">{saveMessage}</span>
            )}
            {saveError && (
              <span className="font-mono text-[11.5px] text-[#991b1b]">{saveError}</span>
            )}
          </div>
        </Section>

        <Section title="Capabilities" icon={<Shield size={13} />}>
          <div className="flex flex-wrap gap-[5px]">
            {app.capabilities.map((c) => (
              <span
                key={c}
                className="font-mono text-[10.5px] px-[8px] py-[3px] bg-bg border border-line rounded text-fg-muted font-semibold"
              >
                {c}
              </span>
            ))}
          </div>
          <div className="mt-3 text-[12px] text-fg-muted">
            Capabilities are edited via the Chat-to-edit flow or manifest upload. Inline editing
            ships in a future sprint.
          </div>
        </Section>

        <Section title="Danger zone" icon={<AlertTriangle size={13} />} tone="danger">
          <div className="text-[13px] text-fg mb-2">Delete this app.</div>
          <div className="text-[12.5px] text-fg-muted mb-4 leading-[1.55]">
            Removes the app from mine / shared lists. Execution and version history remain in the
            mock store until reload. Real deletion in production would also revoke capabilities
            and stop any scheduled triggers.
          </div>
          <label className="block text-[12px] text-fg-muted font-mono mb-2">
            Type <span className="text-fg">{app.id}</span> to confirm:
          </label>
          <input
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            className="w-full px-3 py-[8px] bg-bg border border-line rounded-[9px] text-[13px] font-mono outline-none focus:border-[#ef4444] transition-colors mb-3"
          />
          <button
            onClick={runDelete}
            disabled={confirmDelete !== app.id || deleting}
            className="px-[14px] py-[9px] bg-[#ef4444] text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-[6px] hover:bg-[#dc2626] disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete app'}
          </button>
          {deleteError && (
            <div className="mt-3 font-mono text-[11.5px] text-[#991b1b]">{deleteError}</div>
          )}
        </Section>
      </div>

      <div className="space-y-4">
        <InfoPanel title="Ownership" icon={<Users size={12} />}>
          <div className="text-[12.5px] text-fg">{app.ownerId}</div>
          {app.teamId && (
            <div className="font-mono text-[11px] text-fg-subtle mt-1">{app.teamId}</div>
          )}
        </InfoPanel>
        <InfoPanel title="Source">
          <div className="text-[12.5px] text-fg capitalize">{app.group}</div>
          {app.source && (
            <div className="font-mono text-[11px] text-fg-subtle mt-1">{app.source}</div>
          )}
        </InfoPanel>
        <InfoPanel title="Advanced (read-only)">
          <div className="space-y-[4px] text-[11.5px] font-mono">
            <Row label="id">{app.id}</Row>
            <Row label="tenant">{app.tenantId}</Row>
            <Row label="status">{app.status}</Row>
            <Row label="viewKind">{app.viewKind}</Row>
          </div>
        </InfoPanel>
      </div>
    </div>
  )
}

function Section({
  title,
  icon,
  tone,
  children,
}: {
  title: string
  icon?: React.ReactNode
  tone?: 'danger'
  children: React.ReactNode
}) {
  return (
    <div
      className={`bg-card border rounded-[12px] p-5 ${
        tone === 'danger' ? 'border-[#ef4444]/25' : 'border-line'
      }`}
    >
      <div
        className={`flex items-center gap-[6px] font-mono text-[11px] font-bold uppercase tracking-[0.1em] mb-4 ${
          tone === 'danger' ? 'text-[#ef4444]' : 'text-fg-muted'
        }`}
      >
        {icon}
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-[10.5px] text-fg-subtle uppercase tracking-wider mb-[5px]">
        {label}
      </div>
      {children}
    </label>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-fg-subtle uppercase w-[60px]">{label}</span>
      <span className="text-fg-muted break-all">{children}</span>
    </div>
  )
}
