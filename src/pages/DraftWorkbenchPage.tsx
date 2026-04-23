import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useDraft } from '@/hooks/useDraft'
import {
  appendRefineTurn,
  deleteDraft,
  publishDraft,
  updateDraftTitle,
} from '@/mock/drafts'
import { WorkbenchTopBar } from '@/components/workbench/WorkbenchTopBar'
import { WorkbenchRefinePanel } from '@/components/workbench/WorkbenchRefinePanel'
import { WorkbenchPreview } from '@/components/workbench/WorkbenchPreview'
import { HistoryDrawer } from '@/components/workbench/HistoryDrawer'
import { DeleteDraftModal } from '@/components/workbench/DeleteDraftModal'

export default function DraftWorkbenchPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: draft, loading, error, refresh } = useDraft(id)

  const [refining, setRefining] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null)

  const previewSpec = useMemo(() => {
    if (!draft) return null
    if (!selectedTurnId) return draft.currentSpec
    const turn = draft.turns.find((t) => t.id === selectedTurnId)
    return turn?.specSnapshot ?? draft.currentSpec
  }, [draft, selectedTurnId])

  const historicalInfo = useMemo(() => {
    if (!draft || !selectedTurnId) return undefined
    const versions = draft.turns.filter((t) => t.specSnapshot)
    const idx = versions.findIndex((t) => t.id === selectedTurnId)
    if (idx === -1) return undefined
    return {
      versionLabel: `v${String(idx + 1).padStart(2, '0')}`,
      onExit: () => setSelectedTurnId(null),
    }
  }, [draft, selectedTurnId])

  if (loading && !draft) {
    return (
      <div className="h-full flex items-center justify-center text-fg-subtle">
        <Loader2 size={16} className="animate-spin mr-2" />
        <span className="font-mono text-[11px] uppercase tracking-wider">
          loading draft…
        </span>
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="max-w-[380px] text-center">
          <div className="w-10 h-10 mx-auto rounded-[10px] bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <AlertTriangle size={18} />
          </div>
          <h2 className="text-[15px] font-bold text-fg mb-1">Draft unavailable</h2>
          <p className="text-[12.5px] text-fg-muted leading-[1.55] mb-4">
            {error?.message ?? "This draft can't be found — it may have been deleted or published."}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => refresh()}
              className="h-[30px] px-[12px] rounded-[7px] border border-line text-[12px] text-fg-muted hover:bg-line-soft"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="h-[30px] px-[12px] rounded-[7px] bg-accent text-white text-[12px] font-semibold hover:bg-[#1d4ed8]"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleRename = async (next: string) => {
    try {
      await updateDraftTitle(draft.id, next)
      refresh()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSendRefine = async (message: string) => {
    setRefining(true)
    try {
      await appendRefineTurn(draft.id, message)
      setSelectedTurnId(null)
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setRefining(false)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const { session } = await publishDraft(draft.id)
      navigate(`/generate/${session.id}`)
    } catch (e) {
      console.error(e)
      setPublishing(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteDraft(draft.id)
      navigate('/')
    } catch (e) {
      console.error(e)
      setDeleting(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <WorkbenchTopBar
        draft={draft}
        onRename={handleRename}
        onOpenHistory={() => setHistoryOpen(true)}
        onRequestDelete={() => setDeleteOpen(true)}
        onPublish={handlePublish}
        publishing={publishing}
      />

      <div className="flex-1 min-h-0 relative">
        <div
          className="h-full grid"
          style={{ gridTemplateColumns: '420px 1fr' }}
        >
          <WorkbenchRefinePanel
            draft={draft}
            onSend={handleSendRefine}
            pending={refining}
          />
          {previewSpec && (
            <WorkbenchPreview
              draft={draft}
              spec={previewSpec}
              historical={historicalInfo}
            />
          )}
        </div>

        <HistoryDrawer
          open={historyOpen}
          turns={draft.turns}
          selectedTurnId={selectedTurnId}
          onClose={() => setHistoryOpen(false)}
          onSelect={(turnId) => {
            setSelectedTurnId(turnId)
            setHistoryOpen(false)
          }}
        />
      </div>

      <DeleteDraftModal
        open={deleteOpen}
        draftTitle={draft.title}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}
