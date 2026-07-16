// Domain entity types for the Import Cost Management System.
// These mirror the PRD "Database Entities" and are storage-agnostic — the same
// shapes are used by the IndexedDB (MVP) and future HTTP/PHP repositories.

export type ID = string

export type Currency = 'USD' | 'CNY' | 'PEN' | 'EUR'
export type Incoterm = 'FOB' | 'CIF' | 'EXW' | 'FCA' | 'CFR' | 'DDP'
export type Finish = '1-side-uv' | '2-side-uv'

/** How shared logistics + tax costs are spread across products. */
export type AllocationMethod = 'quantity' | 'weight' | 'area' | 'fob'

export interface Timestamped {
  createdAt: string
  updatedAt: string
}

export interface Supplier extends Timestamped {
  id: ID
  company: string
  contact?: string
  country?: string
  currency: Currency
  paymentTerms?: string
  incoterms?: Incoterm
  notes?: string
}

export interface Product extends Timestamped {
  id: ID
  sku: string
  name: string
  category?: string
  /** Board thickness in millimetres. */
  thickness?: number
  finish?: Finish
  /** Sheet length in metres. */
  length: number
  /** Sheet width in metres. */
  width: number
  /** Surface area per unit in m² (length × width). */
  area: number
  /** Unit weight in kilograms. */
  weight: number
  /** Unit FOB price in the supplier's currency. */
  unitFobPrice: number
  supplierId?: ID
}

/**
 * A purchase-order line. Product attributes are snapshotted at import time so
 * historical records stay accurate even if the catalog later changes.
 */
export interface PurchaseOrderItem {
  productId: ID
  sku: string
  name: string
  quantity: number
  unitFobPrice: number
  area: number
  weight: number
}

export interface LogisticsCosts {
  international: {
    oceanFreight: number
    insurance: number
    blService: number
    other: number
  }
  destination: {
    deconsolidation: number
    warehouse: number
    handling: number
    customsRelease: number
    monitoring: number
    portCharges: number
    other: number
  }
  broker: {
    brokerage: number
    customsProcessing: number
    localDelivery: number
    miscellaneous: number
  }
}

/** SUNAT customs inputs (rates entered by the user). */
export interface TaxProfile {
  /** Exchange rate to the reporting currency (PEN). */
  exchangeRate: number
  adValoremPct: number
  igvPct: number
  ipmPct: number
  perceptionPct: number
}

/**
 * A complete import — the top-level aggregate the History module compares.
 * Stores raw inputs plus a computed summary snapshot (see lib/calc/engine).
 */
export interface ImportRecord extends Timestamped {
  id: ID
  name: string
  /** ISO date of the import. */
  date: string
  supplierId?: ID
  items: PurchaseOrderItem[]
  logistics: LogisticsCosts
  taxes: TaxProfile
  allocationMethod: AllocationMethod
  /** Desired gross margin for the suggested selling price (0–1). */
  targetMargin?: number
}

export const CURRENCIES: Currency[] = ['USD', 'CNY', 'PEN', 'EUR']
export const INCOTERMS: Incoterm[] = ['FOB', 'CIF', 'EXW', 'FCA', 'CFR', 'DDP']
export const FINISHES: Finish[] = ['1-side-uv', '2-side-uv']

/** i18n key for a finish value's display label. */
export const FINISH_LABEL_KEYS: Record<Finish, string> = {
  '1-side-uv': 'products.finish.oneSide',
  '2-side-uv': 'products.finish.twoSide',
}
export const ALLOCATION_METHODS: AllocationMethod[] = [
  'quantity',
  'weight',
  'area',
  'fob',
]

export const ALLOCATION_METHOD_LABELS: Record<AllocationMethod, string> = {
  quantity: 'By Quantity',
  weight: 'By Weight',
  area: 'By Area (m²)',
  fob: 'By FOB Value',
}
