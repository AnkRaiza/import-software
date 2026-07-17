// IndexedDB implementation of the repository interface, backed by Dexie.

import type { Table } from 'dexie'
import type {
  ID,
  ImportRecord,
  Product,
  Quotation,
  Supplier,
  Timestamped,
} from '../db/types'
import { db } from '../db/schema'
import type {
  CrudRepository,
  EntityPatch,
  NewEntity,
  Repository,
} from './types'

const now = (): string => new Date().toISOString()
const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`

class DexieCrud<T extends Timestamped & { id: ID }>
  implements CrudRepository<T>
{
  private table: Table<T, string>

  constructor(table: Table<T, string>) {
    this.table = table
  }

  all(): Promise<T[]> {
    return this.table.toArray()
  }

  get(id: ID): Promise<T | undefined> {
    return this.table.get(id)
  }

  async create(input: NewEntity<T>): Promise<T> {
    const ts = now()
    const entity = { ...input, id: newId(), createdAt: ts, updatedAt: ts } as T
    await this.table.add(entity)
    return entity
  }

  async update(id: ID, patch: EntityPatch<T>): Promise<T> {
    const existing = await this.table.get(id)
    if (!existing) throw new Error(`Record not found: ${id}`)
    const updated = { ...existing, ...patch, updatedAt: now() } as T
    await this.table.put(updated)
    return updated
  }

  async remove(id: ID): Promise<void> {
    await this.table.delete(id)
  }
}

export const dexieRepository: Repository = {
  suppliers: new DexieCrud<Supplier>(db.suppliers),
  products: new DexieCrud<Product>(db.products),
  imports: new DexieCrud<ImportRecord>(db.imports),
  quotations: new DexieCrud<Quotation>(db.quotations),
}
