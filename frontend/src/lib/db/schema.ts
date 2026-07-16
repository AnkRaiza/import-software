// IndexedDB schema (Dexie). This is the MVP persistence layer; it sits behind
// the repository interface so it can be swapped for an HTTP/PHP backend later
// without touching UI or calc code.

import Dexie, { type Table } from 'dexie'
import type { ImportRecord, Product, Supplier } from './types'

export class AppDB extends Dexie {
  suppliers!: Table<Supplier, string>
  products!: Table<Product, string>
  imports!: Table<ImportRecord, string>

  constructor() {
    super('import-cost-management')
    // Only indexed fields are listed; full objects are stored regardless.
    this.version(1).stores({
      suppliers: 'id, company, country',
      products: 'id, sku, name, supplierId',
      imports: 'id, date, name, supplierId',
    })
  }
}

export const db = new AppDB()
