// Demo seed data (client's real order for reference). Kept as pure data +
// factory so it can be inserted through the normal repository AND unit-tested.
// The seeded records behave exactly like user-created data.

import type {
  AllocationMethod,
  Finish,
  LogisticsCosts,
  Product,
  PurchaseOrderItem,
  Supplier,
  TaxProfile,
} from './db/types'
import type { NewEntity } from './repo'

export const SEED_SUPPLIER: NewEntity<Supplier> = {
  company: 'Shandong PVC Boards Co., Ltd.',
  country: 'China',
  currency: 'USD',
  incoterms: 'FOB',
  paymentTerms: '30% Deposit, 70% Before Shipment',
}

export interface SeedProductSpec {
  sku: string
  name: string
  category: string
  thickness: number
  finish: Finish
  length: number
  width: number
  area: number
  weight: number
  unitFobPrice: number
}

// Dimensions 1220 × 2440 mm → 1.22 × 2.44 m = 2.9768 m².
export const SEED_PRODUCTS: SeedProductSpec[] = [
  { sku: 'PVC-12-1UV', name: 'PVC UV Board', category: 'PVC UV Board', thickness: 12, finish: '1-side-uv', length: 2.44, width: 1.22, area: 2.9768, weight: 12, unitFobPrice: 20.2 },
  { sku: 'PVC-15-1UV', name: 'PVC UV Board', category: 'PVC UV Board', thickness: 15, finish: '1-side-uv', length: 2.44, width: 1.22, area: 2.9768, weight: 15, unitFobPrice: 21.4 },
  { sku: 'PVC-18-2UV', name: 'PVC UV Board', category: 'PVC UV Board', thickness: 18, finish: '2-side-uv', length: 2.44, width: 1.22, area: 2.9768, weight: 18, unitFobPrice: 22.5 },
]

export const SEED_PO: { sku: string; quantity: number }[] = [
  { sku: 'PVC-18-2UV', quantity: 200 },
  { sku: 'PVC-12-1UV', quantity: 150 },
  { sku: 'PVC-15-1UV', quantity: 150 },
]

// Starport example — lump sums mapped onto the section fields.
export const SEED_LOGISTICS: LogisticsCosts = {
  international: { oceanFreight: 915, insurance: 0, blService: 0, other: 0 },
  destination: {
    deconsolidation: 0,
    warehouse: 0,
    handling: 0,
    customsRelease: 0,
    monitoring: 0,
    portCharges: 0,
    other: 1008.9,
  },
  broker: { brokerage: 637.2, customsProcessing: 0, localDelivery: 0, miscellaneous: 0 },
}

export const SEED_TAXES: TaxProfile = {
  exchangeRate: 3.7,
  adValoremPct: 6,
  igvPct: 18,
  ipmPct: 2,
  perceptionPct: 3.5,
}

export const SEED_ALLOCATION: AllocationMethod = 'quantity'
export const SEED_MARGIN = 0.35
export const SEED_IMPORT_NAME = 'Demo Import — Starport'

/** Build PO line items by matching seed products to their ordered quantities. */
export function buildSeedItems(
  products: Pick<Product, 'id' | 'sku' | 'name' | 'unitFobPrice' | 'area' | 'weight'>[],
): PurchaseOrderItem[] {
  return SEED_PO.map((po) => {
    const p = products.find((x) => x.sku === po.sku)
    if (!p) throw new Error(`Seed product not found: ${po.sku}`)
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      quantity: po.quantity,
      unitFobPrice: p.unitFobPrice,
      area: p.area,
      weight: p.weight,
    }
  })
}
