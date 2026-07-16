// Precise money/measurement math. Never use native float arithmetic for
// currency — decimal.js avoids the 0.1 + 0.2 !== 0.3 class of errors that
// would corrupt landed-cost totals.

import Decimal from 'decimal.js'

// 28 significant digits is plenty for import accounting.
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export type Numeric = number | string | Decimal

export const d = (v: Numeric = 0): Decimal =>
  new Decimal(v === '' || v === null || v === undefined ? 0 : v)

/** Sum a list of numeric-ish values precisely. */
export const sum = (values: Numeric[]): Decimal =>
  values.reduce<Decimal>((acc, v) => acc.plus(d(v)), new Decimal(0))

/** Round to a fixed number of decimals and return a plain number for storage. */
export const round = (v: Numeric, dp = 2): number => d(v).toDecimalPlaces(dp).toNumber()

/** Format a value as currency for display. */
export const formatMoney = (
  v: Numeric,
  currency = 'USD',
  locale = 'en-US',
): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(d(v).toNumber())

/** Format a plain number with thousands separators. */
export const formatNumber = (v: Numeric, dp = 2, locale = 'en-US'): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(d(v).toNumber())

/** Format a 0–1 ratio as a percentage string. */
export const formatPercent = (ratio: Numeric, dp = 1, locale = 'en-US'): string =>
  new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(d(ratio).toNumber())

export { Decimal }
