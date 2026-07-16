import { describe, expect, it } from 'vitest'
import { calculateImport } from './calc/engine'
import {
  SEED_ALLOCATION,
  SEED_LOGISTICS,
  SEED_MARGIN,
  SEED_PRODUCTS,
  SEED_TAXES,
  buildSeedItems,
} from './seedData'

// Products as they'd exist after insertion (ids assigned by the repository).
const products = SEED_PRODUCTS.map((s, i) => ({
  ...s,
  id: `seed-${i}`,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}))

describe('demo seed import', () => {
  const result = calculateImport({
    items: buildSeedItems(products),
    logistics: SEED_LOGISTICS,
    taxes: SEED_TAXES,
    allocationMethod: SEED_ALLOCATION,
    targetMargin: SEED_MARGIN,
  })
  const { summary } = result

  it('has the expected purchase-order rollups', () => {
    expect(summary.totalFob).toBe(10740) // 200*22.5 + 150*20.2 + 150*21.4
    expect(summary.totalUnits).toBe(500)
    expect(summary.totalWeight).toBe(7650) // 200*18 + 150*12 + 150*15
    expect(summary.totalArea).toBeCloseTo(1488.4, 4) // 500 * 2.9768
  })

  it('has the expected logistics and taxes', () => {
    expect(summary.totalLogistics).toBe(2561.1) // 915 + 1008.9 + 637.2
    expect(summary.totalTaxes).toBeCloseTo(3689.04, 2)
  })

  it('has the expected landed cost and averages', () => {
    expect(summary.totalLandedCost).toBeCloseTo(16990.14, 2)
    expect(summary.avgCostPerUnit).toBeCloseTo(33.9803, 3) // 16990.14 / 500
    expect(summary.avgCostPerM2).toBeCloseTo(11.4152, 3) // 16990.14 / 1488.4
  })

  it('prices at the 35% target margin', () => {
    expect(summary.grossMargin).toBeCloseTo(0.35, 4)
    expect(summary.suggestedSellingPrice).toBeCloseTo(26138.68, 2)
  })

  it('allocates by quantity (200/150/150 → 0.4/0.3/0.3)', () => {
    const shares = result.allocations.map((a) => a.share)
    expect(shares).toEqual([0.4, 0.3, 0.3])
  })
})
