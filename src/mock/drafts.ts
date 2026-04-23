import type {
  AppViewKind,
  RefineTurn,
  Session,
  SpecDraft,
  SpecSnapshot,
} from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { draftsSeed } from './seed/drafts'
import { createSession } from './sessions'

const store = createStore<SpecDraft>(draftsSeed)

export interface DraftQuery {
  page?: number
  size?: number
  status?: SpecDraft['status']
  createdBy?: string
  search?: string
  sort?: 'updatedAt-desc' | 'updatedAt-asc'
}

function buildListQuery(q: DraftQuery = {}): ListQuery<SpecDraft> {
  const needle = q.search?.trim().toLowerCase()
  return {
    page: q.page,
    size: q.size,
    filter: (d) => {
      if (q.status && d.status !== q.status) return false
      if (q.createdBy && d.createdBy !== q.createdBy) return false
      if (needle) {
        const hay = `${d.title} ${d.initialPrompt}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    },
    sort: (a, b) => {
      const cmp = a.updatedAt.localeCompare(b.updatedAt)
      return q.sort === 'updatedAt-asc' ? cmp : -cmp
    },
  }
}

export async function listDrafts(query: DraftQuery = {}): Promise<ListResult<SpecDraft>> {
  await jitter()
  const err = shouldInject('drafts', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getDraft(id: string): Promise<SpecDraft | null> {
  await jitter()
  const err = shouldInject('drafts', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export interface CreateDraftOptions {
  createdBy?: string
  tenantId?: string
}

function inferViewKind(prompt: string): AppViewKind {
  const p = prompt.toLowerCase()
  if (/(notify|alert|告警|通知|push|send)/.test(p)) return 'notifier'
  if (/(report|summary|周报|日报|weekly|daily)/.test(p)) return 'report'
  if (/(form|submit|表单|approval|审批)/.test(p)) return 'form'
  if (/(bot|chat|问答|对话)/.test(p)) return 'bot'
  return 'dashboard'
}

function titleFromPrompt(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Untitled draft'
  if (trimmed.length <= 48) return trimmed
  return `${trimmed.slice(0, 45)}…`
}

function initialSnapshot(prompt: string): SpecSnapshot {
  return {
    name: titleFromPrompt(prompt),
    description: prompt.slice(0, 200),
    viewKind: inferViewKind(prompt),
    capabilities: [],
  }
}

export async function createDraft(
  prompt: string,
  opts: CreateDraftOptions = {},
): Promise<SpecDraft> {
  await jitter()
  const err = shouldInject('drafts', 'create')
  if (err) throw err
  const trimmed = prompt.trim()
  if (!trimmed) throw new Error('createDraft: prompt is empty')

  const now = new Date().toISOString()
  const id = `draft-${Math.random().toString(36).slice(2, 10)}`
  const snapshot = initialSnapshot(trimmed)
  const firstTurn: RefineTurn = {
    id: `turn-${Math.random().toString(36).slice(2, 10)}`,
    role: 'user',
    content: trimmed,
    createdAt: now,
  }
  const assistantTurn: RefineTurn = {
    id: `turn-${Math.random().toString(36).slice(2, 10)}`,
    role: 'assistant',
    content: `Reading your intent. I'll scope this as a **${snapshot.viewKind}** called **${snapshot.name}**. Refine anything below, or publish to generate.`,
    createdAt: now,
    specSnapshot: snapshot,
  }

  const draft: SpecDraft = {
    id,
    tenantId: opts.tenantId ?? 'acme',
    createdBy: opts.createdBy ?? 'u-samzong',
    title: snapshot.name,
    initialPrompt: trimmed,
    turns: [firstTurn, assistantTurn],
    currentSpec: snapshot,
    status: 'drafting',
    createdAt: now,
    updatedAt: now,
  }
  store.create(draft)
  return draft
}

export async function updateDraftTitle(id: string, title: string): Promise<SpecDraft> {
  await jitter()
  const err = shouldInject('drafts', 'update')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`updateDraftTitle: draft "${id}" not found`)
  return store.update(id, {
    title: title.trim() || existing.title,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteDraft(id: string): Promise<void> {
  await jitter()
  const err = shouldInject('drafts', 'delete')
  if (err) throw err
  store.delete(id)
}

export async function appendRefineTurn(
  id: string,
  userMessage: string,
): Promise<SpecDraft> {
  await jitter()
  const err = shouldInject('drafts', 'refine')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`appendRefineTurn: draft "${id}" not found`)
  const trimmed = userMessage.trim()
  if (!trimmed) throw new Error('appendRefineTurn: message is empty')

  const now = new Date().toISOString()
  const userTurn: RefineTurn = {
    id: `turn-${Math.random().toString(36).slice(2, 10)}`,
    role: 'user',
    content: trimmed,
    createdAt: now,
  }
  const nextSpec: SpecSnapshot = {
    ...existing.currentSpec,
    description: trimmed.slice(0, 200) || existing.currentSpec.description,
  }
  const assistantTurn: RefineTurn = {
    id: `turn-${Math.random().toString(36).slice(2, 10)}`,
    role: 'assistant',
    content: `Applied. New version captured — you can switch back to any prior turn from the history drawer.`,
    createdAt: now,
    specSnapshot: nextSpec,
  }

  return store.update(id, {
    turns: [...existing.turns, userTurn, assistantTurn],
    currentSpec: nextSpec,
    updatedAt: now,
  })
}

export async function publishDraft(id: string): Promise<{ draft: SpecDraft; session: Session }> {
  await jitter()
  const err = shouldInject('drafts', 'publish')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`publishDraft: draft "${id}" not found`)
  if (existing.status === 'published' && existing.publishedSessionId) {
    throw new Error(`publishDraft: draft "${id}" already published`)
  }

  const prompt = existing.currentSpec.description?.trim() || existing.initialPrompt
  const session = await createSession(prompt, {
    createdBy: existing.createdBy,
    tenantId: existing.tenantId,
  })

  const now = new Date().toISOString()
  const draft = store.update(id, {
    status: 'published',
    publishedSessionId: session.id,
    updatedAt: now,
  })
  return { draft, session }
}
