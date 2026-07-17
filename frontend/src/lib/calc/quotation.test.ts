import { describe, expect, it } from 'vitest'
import type { QuotationItem } from '../db/types'
import { computeQuotationTotals, quotationLineTotal } from './quotation'

const items: QuotationItem[] = [
  { name: 'Board A', quantity: 10, unitPrice: 25.5 },
  { name: 'Board B', quantity: 4, unitPrice: 100 },
]

describe('quotation totals', () => {
  it('line total = quantity × unit price', () => {
    expect(quotationLineTotal(items[0])).toBe(255)
    expect(quotationLineTotal(items[1])).toBe(400)
  })

  it('subtotal + IGV when taxable', () => {
    const r = computeQuotationTotals(items, true, 18)
    expect(r.subtotal).toBe(655) // 255 + 400
    expect(r.igv).toBe(117.9) // 655 * 18%
    expect(r.total).toBe(772.9)
  })

  it('no IGV when not taxable', () => {
    const r = computeQuotationTotals(items, false, 18)
    expect(r.igv).toBe(0)
    expect(r.total).toBe(655)
  })

  it('empty quotation is all zeros', () => {
    expect(computeQuotationTotals([], true, 18)).toEqual({
      subtotal: 0,
      igv: 0,
      total: 0,
    })
  })
})
