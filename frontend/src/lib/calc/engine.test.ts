import { describe, expect, it } from 'vitest'
import type {
  LogisticsCosts,
  PurchaseOrderItem,
  TaxProfile,
} from '../db/types'
import {
  calculateImport,
  computeCustoms,
  computeLogistics,
  type CalcInput,
} from './engine'
import { d } from './money'

// --- Shared fixtures ---------------------------------------------------------

const items: PurchaseOrderItem[] = [
  { productId: 'a', sku: 'A', name: 'Prod A', quantity: 100, unitFobPrice: 10, area: 2, weight: 5 },
  { productId: 'b', sku: 'B', name: 'Prod B', quantity: 50, unitFobPrice: 20, area: 3, weight: 8 },
]

const logistics: LogisticsCosts = {
  international: { oceanFreight: 300, insurance: 50, blService: 20, other: 10 },
  destination: {
    deconsolidation: 40,
    warehouse: 30,
    handling: 20,
    customsRelease: 25,
    monitoring: 15,
    portCharges: 35,
    other: 10,
  },
  broker: { brokerage: 60, customsProcessing: 40, localDelivery: 30, miscellaneous: 20 },
}

const taxes: TaxProfile = {
  exchangeRate: 3.75,
  adValoremPct: 6,
  igvPct: 16,
  ipmPct: 2,
  perceptionPct: 3.5,
}

const baseInput: CalcInput = { items, logistics, taxes, allocationMethod: 'fob' }

// --- Logistics ---------------------------------------------------------------

describe('computeLogistics', () => {
  it('sums each section and the grand total', () => {
    const r = computeLogistics(logistics)
    expect(r.international).toBe(380) // 300+50+20+10
    expect(r.destination).toBe(175) // 40+30+20+25+15+35+10
    expect(r.broker).toBe(150) // 60+40+30+20
    expect(r.total).toBe(705)
  })
})

// --- Customs (SUNAT) ---------------------------------------------------------

describe('computeCustoms', () => {
  const fob = d(2000) // 100*10 + 50*20
  const c = computeCustoms(fob, logistics, taxes)

  it('CIF = FOB + ocean freight + insurance', () => {
    expect(c.cif).toBe(2350) // 2000 + 300 + 50
  })

  it('Ad Valorem is charged on CIF', () => {
    expect(c.adValorem).toBe(141) // 2350 * 6%
  })

  it('tax base = CIF + Ad Valorem', () => {
    expect(c.taxBase).toBe(2491)
  })

  it('IGV and IPM are charged on the tax base', () => {
    expect(c.igv).toBe(398.56) // 2491 * 16%
    expect(c.ipm).toBe(49.82) // 2491 * 2%
  })

  it('Perception is charged on tax base + IGV + IPM', () => {
    // (2491 + 398.56 + 49.82) * 3.5% = 2939.38 * 0.035 = 102.8783
    expect(c.perception).toBeCloseTo(102.88, 2)
  })

  it('total taxes = adValorem + igv + ipm + perception', () => {
    expect(c.totalTaxes).toBeCloseTo(692.26, 2)
  })
})

// --- Full import calculation -------------------------------------------------

describe('calculateImport', () => {
  it('computes summary totals', () => {
    const r = calculateImport(baseInput)
    expect(r.summary.totalFob).toBe(2000)
    expect(r.summary.totalLogistics).toBe(705)
    expect(r.summary.totalTaxes).toBeCloseTo(692.26, 2)
    expect(r.summary.totalLandedCost).toBeCloseTo(3397.26, 2)
    expect(r.summary.totalUnits).toBe(150)
    expect(r.summary.totalWeight).toBe(900) // 100*5 + 50*8
    expect(r.summary.totalArea).toBe(350) // 100*2 + 50*3
  })

  it('allocates by FOB value (equal here → 50/50)', () => {
    const r = calculateImport({ ...baseInput, allocationMethod: 'fob' })
    expect(r.allocations[0].share).toBeCloseTo(0.5, 6)
    expect(r.allocations[1].share).toBeCloseTo(0.5, 6)
    expect(r.allocations[0].logisticsAllocation).toBeCloseTo(352.5, 2)
    expect(r.allocations[0].taxAllocation).toBeCloseTo(346.13, 2)
    expect(r.allocations[0].landedCost).toBeCloseTo(1698.63, 2)
  })

  it('allocates by quantity', () => {
    const r = calculateImport({ ...baseInput, allocationMethod: 'quantity' })
    expect(r.allocations[0].share).toBeCloseTo(100 / 150, 6)
    expect(r.allocations[1].share).toBeCloseTo(50 / 150, 6)
  })

  it('allocates by weight', () => {
    const r = calculateImport({ ...baseInput, allocationMethod: 'weight' })
    expect(r.allocations[0].share).toBeCloseTo(500 / 900, 6)
  })

  it('allocates by area', () => {
    const r = calculateImport({ ...baseInput, allocationMethod: 'area' })
    expect(r.allocations[0].share).toBeCloseTo(200 / 350, 6)
  })

  it('allocation shares sum to 1 and cover the full shared cost', () => {
    const r = calculateImport(baseInput)
    const shareSum = r.allocations.reduce((s, a) => s + a.share, 0)
    expect(shareSum).toBeCloseTo(1, 6)
    const allocatedTotal = r.allocations.reduce(
      (s, a) => s + a.logisticsAllocation + a.taxAllocation,
      0,
    )
    expect(allocatedTotal).toBeCloseTo(705 + r.summary.totalTaxes, 1)
  })

  it('computes per-unit and per-m² cost', () => {
    const r = calculateImport(baseInput)
    // Prod A landed 1698.63 / 100 units = 16.9863
    expect(r.allocations[0].costPerUnit).toBeCloseTo(16.9863, 3)
    // 1698.63 / (100*2 = 200 m²) = 8.4931
    expect(r.allocations[0].costPerM2).toBeCloseTo(8.4931, 3)
  })

  it('produces pricing tiers where margin 50% doubles cost', () => {
    const r = calculateImport(baseInput)
    const tier50 = r.pricingTiers.find((t) => t.margin === 0.5)!
    expect(tier50.sellingPrice).toBeCloseTo(r.summary.totalLandedCost * 2, 1)
    expect(tier50.grossProfit).toBeCloseTo(r.summary.totalLandedCost, 1)
  })

  it('uses the target margin for the suggested selling price', () => {
    const r = calculateImport({ ...baseInput, targetMargin: 0.3 })
    // price = cost / (1 - 0.3)
    expect(r.summary.suggestedSellingPrice).toBeCloseTo(
      r.summary.totalLandedCost / 0.7,
      1,
    )
    expect(r.summary.grossMargin).toBeCloseTo(0.3, 4)
  })
})

// --- Edge cases --------------------------------------------------------------

describe('calculateImport edge cases', () => {
  const emptyLogistics: LogisticsCosts = {
    international: { oceanFreight: 0, insurance: 0, blService: 0, other: 0 },
    destination: {
      deconsolidation: 0,
      warehouse: 0,
      handling: 0,
      customsRelease: 0,
      monitoring: 0,
      portCharges: 0,
      other: 0,
    },
    broker: { brokerage: 0, customsProcessing: 0, localDelivery: 0, miscellaneous: 0 },
  }
  const zeroTaxes: TaxProfile = {
    exchangeRate: 1,
    adValoremPct: 0,
    igvPct: 0,
    ipmPct: 0,
    perceptionPct: 0,
  }

  it('handles no items without NaN', () => {
    const r = calculateImport({
      items: [],
      logistics: emptyLogistics,
      taxes: zeroTaxes,
      allocationMethod: 'fob',
    })
    expect(r.summary.totalLandedCost).toBe(0)
    expect(r.summary.avgCostPerUnit).toBe(0)
    expect(r.summary.avgCostPerM2).toBe(0)
    expect(r.allocations).toHaveLength(0)
    expect(Number.isNaN(r.summary.grossMargin)).toBe(false)
  })

  it('guards divide-by-zero for a zero-quantity / zero-area item', () => {
    const r = calculateImport({
      items: [
        { productId: 'z', sku: 'Z', name: 'Zero', quantity: 0, unitFobPrice: 0, area: 0, weight: 0 },
      ],
      logistics,
      taxes,
      allocationMethod: 'quantity',
    })
    expect(r.allocations[0].costPerUnit).toBe(0)
    expect(r.allocations[0].costPerM2).toBe(0)
    expect(Number.isNaN(r.allocations[0].logisticsAllocation)).toBe(false)
  })

  it('caps a 100%+ margin instead of dividing by zero', () => {
    const r = calculateImport({ ...baseInput, targetMargin: 1 })
    expect(r.summary.suggestedSellingPrice).toBe(r.summary.totalLandedCost)
  })
})
