// Repository interface — the seam between the app and its storage backend.
// MVP: IndexedDB (Dexie). Phase 2: an HTTP client hitting the PHP/MySQL API.
// UI and calc code depend only on these interfaces, never on Dexie directly.

import type { ID, ImportRecord, Product, Supplier, Timestamped } from '../db/types'

/** Fields the caller provides; id + timestamps are assigned by the repository. */
export type NewEntity<T extends Timestamped & { id: ID }> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
>

export type EntityPatch<T extends Timestamped & { id: ID }> = Partial<
  Omit<T, 'id' | 'createdAt' | 'updatedAt'>
>

export interface CrudRepository<T extends Timestamped & { id: ID }> {
  all(): Promise<T[]>
  get(id: ID): Promise<T | undefined>
  create(input: NewEntity<T>): Promise<T>
  update(id: ID, patch: EntityPatch<T>): Promise<T>
  remove(id: ID): Promise<void>
}

export interface Repository {
  suppliers: CrudRepository<Supplier>
  products: CrudRepository<Product>
  imports: CrudRepository<ImportRecord>
}
