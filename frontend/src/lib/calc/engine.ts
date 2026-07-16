// Landed-cost calculation engine.
//
// Single source of truth for all import math. Pure functions only — no I/O, no
// storage — so the Scenario Simulator can recompute instantly and the logic is
// unit-testable in isolation. The backend (phase 2) stores inputs + a snapshot
// of these results; it does not re-implement the math.
//
// Pipeline: FOB (from PO) → logistics → CIF → SUNAT taxes → allocate across
// products by the chosen method → per-unit / per-m² cost → pricing tiers.

import type {
  AllocationMethod,
  LogisticsCosts,
  PurchaseOrderItem,
  TaxProfile,
} from '../db/types'
import { Decimal, d, round, sum } from './money'

export interface CalcInput {
  items: PurchaseOrderItem[]
  logistics: LogisticsCosts
  taxes: TaxProfile
  allocationMethod: AllocationMethod
  /** Desired gross margin (0–1) for the headline suggested price. */
  targetMargin?: number
}

export interface LogisticsSubtotals {
  international: number
  destination: number
  broker: number
  total: number
}

export interface CustomsBreakdown {
  cif: number
  taxBase: number
  adValorem: number
  igv: number
  ipm: number
  perception: number
  totalTaxes: number
}

export interface AllocatedProduct {
  productId: string
  sku: string
  name: string
  quantity: number
  totalArea: number
  fob: number
  share: number
  logisticsAllocation: number
  taxAllocation: number
  landedCost: number
  costPerUnit: number
  costPerM2: number
}

export interface PricingTier {
  margin: number
  sellingPrice: number
  grossProfit: number
}

export interface ImportSummary {
  totalFob: number
  totalLogistics: number
  totalTaxes: number
  totalLandedCost: number
  totalUnits: number
  totalWeight: number
  totalArea: number
  avgCostPerUnit: number
  avgCostPerM2: number
  suggestedSellingPrice: number
  grossProfit: number
  grossMargin: number
}

export interface CalcResult {
  logistics: LogisticsSubtotals
  customs: CustomsBreakdown
  allocations: AllocatedProduct[]
  summary: ImportSummary
  pricingTiers: PricingTier[]
}

export const DEFAULT_MARGIN_TIERS = [0.2, 0.25, 0.3, 0.35, 0.4, 0.5]

const lineFob = (item: PurchaseOrderItem): Decimal =>
  d(item.unitFobPrice).times(d(item.quantity))

/** Weight used to distribute shared costs, per allocation method. */
const allocationWeight = (
  item: PurchaseOrderItem,
  method: AllocationMethod,
): Decimal => {
  const qty = d(item.quantity)
  switch (method) {
    case 'quantity':
      return qty
    case 'weight':
      return qty.times(d(item.weight))
    case 'area':
      return qty.times(d(item.area))
    case 'fob':
      return lineFob(item)
  }
}

export function computeLogistics(logistics: LogisticsCosts): LogisticsSubtotals {
  const international = sum(Object.values(logistics.international))
  const destination = sum(Object.values(logistics.destination))
  const broker = sum(Object.values(logistics.broker))
  return {
    international: round(international),
    destination: round(destination),
    broker: round(broker),
    total: round(international.plus(destination).plus(broker)),
  }
}

/**
 * SUNAT customs taxes.
 * CIF = FOB + ocean freight + insurance (the customs valuation base).
 * Ad Valorem is charged on CIF; IGV and IPM on (CIF + Ad Valorem);
 * Perception on (CIF + Ad Valorem + IGV + IPM).
 */
export function computeCustoms(
  fobTotal: Decimal,
  logistics: LogisticsCosts,
  taxes: TaxProfile,
): CustomsBreakdown {
  const cif = fobTotal
    .plus(d(logistics.international.oceanFreight))
    .plus(d(logistics.international.insurance))

  const adValorem = cif.times(d(taxes.adValoremPct).div(100))
  const taxBase = cif.plus(adValorem)
  const igv = taxBase.times(d(taxes.igvPct).div(100))
  const ipm = taxBase.times(d(taxes.ipmPct).div(100))
  const perception = taxBase
    .plus(igv)
    .plus(ipm)
    .times(d(taxes.perceptionPct).div(100))
  const totalTaxes = adValorem.plus(igv).plus(ipm).plus(perception)

  return {
    cif: round(cif),
    taxBase: round(taxBase),
    adValorem: round(adValorem),
    igv: round(igv),
    ipm: round(ipm),
    perception: round(perception),
    totalTaxes: round(totalTaxes),
  }
}

export function calculateImport(input: CalcInput): CalcResult {
  const { items, logistics, taxes, allocationMethod } = input

  const fobTotal = sum(items.map(lineFob))
  const logisticsSubtotals = computeLogistics(logistics)
  const logisticsTotal = d(logisticsSubtotals.total)
  const customs = computeCustoms(fobTotal, logistics, taxes)
  const taxTotal = d(customs.totalTaxes)

  // Total allocation weight across all items (guard against divide-by-zero).
  const totalWeightForAlloc = sum(
    items.map((i) => allocationWeight(i, allocationMethod)),
  )
  const safeWeight = totalWeightForAlloc.isZero()
    ? new Decimal(1)
    : totalWeightForAlloc

  const allocations: AllocatedProduct[] = items.map((item) => {
    const itemWeight = allocationWeight(item, allocationMethod)
    const share = itemWeight.div(safeWeight)
    const fob = lineFob(item)
    const logisticsAllocation = logisticsTotal.times(share)
    const taxAllocation = taxTotal.times(share)
    const landedCost = fob.plus(logisticsAllocation).plus(taxAllocation)
    const qty = d(item.quantity)
    const totalArea = qty.times(d(item.area))

    return {
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      totalArea: round(totalArea, 4),
      fob: round(fob),
      share: round(share, 6),
      logisticsAllocation: round(logisticsAllocation),
      taxAllocation: round(taxAllocation),
      landedCost: round(landedCost),
      costPerUnit: qty.isZero() ? 0 : round(landedCost.div(qty), 4),
      costPerM2: totalArea.isZero() ? 0 : round(landedCost.div(totalArea), 4),
    }
  })

  const totalLandedCost = fobTotal.plus(logisticsTotal).plus(taxTotal)
  const totalUnits = sum(items.map((i) => i.quantity))
  const totalWeight = sum(items.map((i) => d(i.quantity).times(d(i.weight))))
  const totalArea = sum(items.map((i) => d(i.quantity).times(d(i.area))))

  const targetMargin = input.targetMargin ?? 0.3
  const suggestedSellingPrice = grossUpPrice(totalLandedCost, targetMargin)
  const grossProfit = suggestedSellingPrice.minus(totalLandedCost)
  const grossMargin = suggestedSellingPrice.isZero()
    ? new Decimal(0)
    : grossProfit.div(suggestedSellingPrice)

  const summary: ImportSummary = {
    totalFob: round(fobTotal),
    totalLogistics: logisticsSubtotals.total,
    totalTaxes: customs.totalTaxes,
    totalLandedCost: round(totalLandedCost),
    totalUnits: round(totalUnits, 4),
    totalWeight: round(totalWeight, 4),
    totalArea: round(totalArea, 4),
    avgCostPerUnit: totalUnits.isZero()
      ? 0
      : round(totalLandedCost.div(totalUnits), 4),
    avgCostPerM2: totalArea.isZero()
      ? 0
      : round(totalLandedCost.div(totalArea), 4),
    suggestedSellingPrice: round(suggestedSellingPrice),
    grossProfit: round(grossProfit),
    grossMargin: round(grossMargin, 4),
  }

  const pricingTiers: PricingTier[] = DEFAULT_MARGIN_TIERS.map((margin) => {
    const sellingPrice = grossUpPrice(totalLandedCost, margin)
    return {
      margin,
      sellingPrice: round(sellingPrice),
      grossProfit: round(sellingPrice.minus(totalLandedCost)),
    }
  })

  return { logistics: logisticsSubtotals, customs, allocations, summary, pricingTiers }
}

/** Selling price that yields the given gross margin: price = cost / (1 - margin). */
function grossUpPrice(cost: Decimal, margin: number): Decimal {
  const m = d(margin)
  if (m.gte(1)) return cost // guard against a 100%+ margin (division by zero)
  return cost.div(new Decimal(1).minus(m))
}
