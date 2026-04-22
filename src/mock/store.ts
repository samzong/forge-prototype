export interface ListQuery<T> {
  page?: number
  size?: number
  filter?: (entity: T) => boolean
  sort?: (a: T, b: T) => number
}

export interface ListResult<T> {
  items: T[]
  total: number
}

export interface Store<T extends { id: string }> {
  list(query?: ListQuery<T>): ListResult<T>
  get(id: string): T | undefined
  create(entity: T): T
  update(id: string, patch: Partial<T>): T
  delete(id: string): boolean
  seed(entities: T[]): void
  all(): T[]
}

export function createStore<T extends { id: string }>(
  initial: T[] = [],
): Store<T> {
  const map = new Map<string, T>()
  for (const e of initial) map.set(e.id, e)

  return {
    list({ page, size, filter, sort }: ListQuery<T> = {}): ListResult<T> {
      let items = Array.from(map.values())
      if (filter) items = items.filter(filter)
      if (sort) items = items.sort(sort)
      const total = items.length
      if (typeof page === 'number' && typeof size === 'number') {
        const start = (page - 1) * size
        items = items.slice(start, start + size)
      }
      return { items, total }
    },

    get(id) {
      return map.get(id)
    },

    create(entity) {
      if (map.has(entity.id)) {
        throw new Error(`store.create: id "${entity.id}" already exists`)
      }
      map.set(entity.id, entity)
      return entity
    },

    update(id, patch) {
      const existing = map.get(id)
      if (!existing) {
        throw new Error(`store.update: id "${id}" not found`)
      }
      const next = { ...existing, ...patch } as T
      map.set(id, next)
      return next
    },

    delete(id) {
      return map.delete(id)
    },

    seed(entities) {
      map.clear()
      for (const e of entities) map.set(e.id, e)
    },

    all() {
      return Array.from(map.values())
    },
  }
}
