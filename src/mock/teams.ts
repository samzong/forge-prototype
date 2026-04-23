import type { Team, User, Role } from '@/types'
import { createStore, type ListQuery, type ListResult } from './store'
import { jitter } from './delay'
import { shouldInject } from './errorInjection'
import { teamsSeed } from './seed/teams'
import { getUser, updateUser } from './users'

const store = createStore<Team>(teamsSeed)

export interface TeamQuery {
  page?: number
  size?: number
  tenantId?: string
  ownerId?: string
  sort?: 'createdAt-desc' | 'createdAt-asc' | 'name-asc'
}

function buildListQuery(q: TeamQuery = {}): ListQuery<Team> {
  return {
    page: q.page,
    size: q.size,
    filter: (t) => {
      if (q.tenantId && t.tenantId !== q.tenantId) return false
      if (q.ownerId && t.ownerId !== q.ownerId) return false
      return true
    },
    sort: (a, b) => {
      if (q.sort === 'name-asc') return a.name.localeCompare(b.name)
      const cmp = a.createdAt.localeCompare(b.createdAt)
      return q.sort === 'createdAt-asc' ? cmp : -cmp
    },
  }
}

export async function listTeams(query: TeamQuery = {}): Promise<ListResult<Team>> {
  await jitter()
  const err = shouldInject('teams', 'list')
  if (err) throw err
  return store.list(buildListQuery(query))
}

export async function getTeam(id: string): Promise<Team | null> {
  await jitter()
  const err = shouldInject('teams', 'get')
  if (err) throw err
  return store.get(id) ?? null
}

export type CreateTeamInput = Omit<Team, 'id' | 'createdAt'> & {
  id?: string
  createdAt?: string
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  await jitter()
  const err = shouldInject('teams', 'create')
  if (err) throw err
  const id = input.id ?? `team-${Math.random().toString(36).slice(2, 8)}`
  const team: Team = {
    ...input,
    id,
    createdAt: input.createdAt ?? new Date().toISOString(),
  }
  return store.create(team)
}

export async function updateTeam(
  id: string,
  patch: Partial<Pick<Team, 'name' | 'ownerId'>>,
): Promise<Team> {
  await jitter()
  const err = shouldInject('teams', 'update')
  if (err) throw err
  const existing = store.get(id)
  if (!existing) throw new Error(`updateTeam: id "${id}" not found`)
  return store.update(id, patch)
}

export async function deleteTeam(id: string): Promise<boolean> {
  await jitter()
  const err = shouldInject('teams', 'delete')
  if (err) throw err
  return store.delete(id)
}

export async function addTeamMember(teamId: string, userId: string): Promise<User> {
  const err = shouldInject('teams', 'addMember')
  if (err) throw err
  const team = store.get(teamId)
  if (!team) throw new Error(`addTeamMember: team "${teamId}" not found`)
  const user = await getUser(userId)
  if (!user) throw new Error(`addTeamMember: user "${userId}" not found`)
  if (user.teamIds.includes(teamId)) return user
  return updateUser(userId, { teamIds: [...user.teamIds, teamId] })
}

export async function removeTeamMember(teamId: string, userId: string): Promise<User> {
  const err = shouldInject('teams', 'removeMember')
  if (err) throw err
  const team = store.get(teamId)
  if (!team) throw new Error(`removeTeamMember: team "${teamId}" not found`)
  const user = await getUser(userId)
  if (!user) throw new Error(`removeTeamMember: user "${userId}" not found`)
  const nextTeamIds = user.teamIds.filter((t) => t !== teamId)
  const patch: Partial<Pick<User, 'teamIds' | 'primaryTeamId'>> = { teamIds: nextTeamIds }
  if (user.primaryTeamId === teamId) {
    patch.primaryTeamId = nextTeamIds[0] ?? teamId
  }
  return updateUser(userId, patch)
}

export async function changeTeamMemberRole(
  userId: string,
  role: Role,
): Promise<User> {
  const err = shouldInject('teams', 'changeMemberRole')
  if (err) throw err
  const user = await getUser(userId)
  if (!user) throw new Error(`changeTeamMemberRole: user "${userId}" not found`)
  return updateUser(userId, { roles: [role] })
}
