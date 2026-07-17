// Quotation math — pure and precise (decimal.js). Selling prices are custom,
// independent of import/landed cost.

import type { QuotationItem } from '../db/types'
import { d, round, sum } from './money'

export interface QuotationTotals {
  subtotal: number
  igv: number
  total: number
}

export const quotationLineTotal = (item: QuotationItem): number =>
  round(d(item.quantity).times(d(item.unitPrice)))

export function computeQuotationTotals(
  items: QuotationItem[],
  includeIgv: boolean,
  igvPct: number,
): QuotationTotals {
  const subtotal = sum(items.map((i) => d(i.quantity).times(d(i.unitPrice))))
  const igv = includeIgv ? subtotal.times(d(igvPct).div(100)) : d(0)
  return {
    subtotal: round(subtotal),
    igv: round(igv),
    total: round(subtotal.plus(igv)),
  }
}
