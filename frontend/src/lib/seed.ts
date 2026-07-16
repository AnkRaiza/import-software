// One-time seeding of demo data. Runs on first load (per browser) when the
// database is empty. Everything is inserted through the normal repository, so
// the demo records are indistinguishable from user-created data — the user can
// edit, duplicate, or delete them freely.

import { repo } from './repo'
import { ACTIVE_IMPORT_KEY } from './activeImport'
import {
  SEED_ALLOCATION,
  SEED_IMPORT_NAME,
  SEED_LOGISTICS,
  SEED_MARGIN,
  SEED_PRODUCTS,
  SEED_SUPPLIER,
  SEED_TAXES,
  buildSeedItems,
} from './seedData'

const SEED_FLAG = 'icm-seeded-v1'

export async function seedIfNeeded(): Promise<void> {
  try {
    if (localStorage.getItem(SEED_FLAG)) return

    // Never overwrite existing data (e.g. a user who predates this feature).
    const [suppliers, products, imports] = await Promise.all([
      repo.suppliers.all(),
      repo.products.all(),
      repo.imports.all(),
    ])
    if (suppliers.length || products.length || imports.length) {
      localStorage.setItem(SEED_FLAG, '1')
      return
    }

    const supplier = await repo.suppliers.create(SEED_SUPPLIER)

    const createdProducts = []
    for (const spec of SEED_PRODUCTS) {
      createdProducts.push(
        await repo.products.create({ ...spec, supplierId: supplier.id }),
      )
    }

    const imp = await repo.imports.create({
      name: SEED_IMPORT_NAME,
      date: new Date().toISOString().slice(0, 10),
      supplierId: supplier.id,
      items: buildSeedItems(createdProducts),
      logistics: SEED_LOGISTICS,
      taxes: SEED_TAXES,
      allocationMethod: SEED_ALLOCATION,
      targetMargin: SEED_MARGIN,
    })

    localStorage.setItem(SEED_FLAG, '1')
    // Make the demo the active import so results are visible immediately.
    if (!localStorage.getItem(ACTIVE_IMPORT_KEY)) {
      localStorage.setItem(ACTIVE_IMPORT_KEY, imp.id)
    }
  } catch (err) {
    // Seeding must never block the app from loading.
    console.error('Seed failed:', err)
  }
}
