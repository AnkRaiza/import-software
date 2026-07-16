import { describe, expect, it } from 'vitest'
import { d, formatMoney, formatPercent, round, sum } from './money'

describe('money helpers', () => {
  it('avoids binary float error (0.1 + 0.2 === 0.3)', () => {
    expect(d(0.1).plus(d(0.2)).toNumber()).toBe(0.3)
    expect(0.1 + 0.2).not.toBe(0.3) // sanity: native float is wrong
  })

  it('treats empty/nullish as zero', () => {
    expect(d('').toNumber()).toBe(0)
    expect(d().toNumber()).toBe(0)
  })

  it('sums a list precisely', () => {
    expect(sum([0.1, 0.2, 0.3]).toNumber()).toBe(0.6)
    expect(sum([]).toNumber()).toBe(0)
  })

  it('rounds half up to the given decimals', () => {
    expect(round(1.005, 2)).toBe(1.01)
    expect(round(2.5, 0)).toBe(3)
    expect(round(1.23456, 4)).toBe(1.2346)
  })

  it('formats currency and percent', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50')
    expect(formatPercent(0.3, 1)).toBe('30.0%')
  })
})
