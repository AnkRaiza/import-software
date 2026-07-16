// Pricing — selling prices and margins derived from the active import's landed
// cost. A custom target margin persists to the import; standard tiers (20–50%)
// come straight from the calc engine.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { repo } from '../../lib/repo'
import type { ImportRecord } from '../../lib/db/types'
import { useActiveImport } from '../../lib/activeImport'
import { calculateImport } from '../../lib/calc/engine'
import { formatNumber, formatPercent } from '../../lib/calc/money'
import { ImportSwitcher } from '../../components/ImportSwitcher'
import { Card, EmptyState, PageHeader } from '../../components/ui'

export default function PricingPage() {
  const { t } = useTranslation()
  const { active } = useActiveImport()

  return (
    <>
      <PageHeader
        title={t('modules.pricing.title')}
        subtitle={t('modules.pricing.subtitle')}
      />
      <ImportSwitcher />

      {!active ? (
        <EmptyState title={t('imports.none')} description={t('imports.chooseOrCreate')} />
      ) : (
        <PricingView key={active.id} importRecord={active} />
      )}
    </>
  )
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </Card>
  )
}

function PricingView({ importRecord }: { importRecord: ImportRecord }) {
  const { t } = useTranslation()
  const [targetMargin, setTargetMargin] = useState(importRecord.targetMargin ?? 0.3)

  const changeTarget = async (pct: number) => {
    const margin = Math.min(Math.max(pct / 100, 0), 0.99)
    setTargetMargin(margin)
    await repo.imports.update(importRecord.id, { targetMargin: margin })
  }

  const result = calculateImport({
    items: importRecord.items,
    logistics: importRecord.logistics,
    taxes: importRecord.taxes,
    allocationMethod: importRecord.allocationMethod,
    targetMargin,
  })
  const { summary } = result

  if (importRecord.items.length === 0) {
    return (
      <EmptyState
        title={t('modules.pricing.title')}
        description={t('pricing.needLines')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">{t('pricing.targetMargin')}</label>
        <input
          type="number"
          step="1"
          min="0"
          max="99"
          value={Math.round(targetMargin * 100)}
          onChange={(e) => changeTarget(Number(e.target.value) || 0)}
          className="w-24 rounded-lg border border-border bg-surface px-3 py-1.5 text-right text-sm outline-none focus:border-primary"
        />
      </Card>

      {/* Suggested pricing at the target margin */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('pricing.landedCost')} value={formatNumber(summary.totalLandedCost, 2)} />
        <StatCard label={t('pricing.margin')} value={formatPercent(summary.grossMargin, 0)} />
        <StatCard label={t('pricing.sellingPrice')} value={formatNumber(summary.suggestedSellingPrice, 2)} />
        <StatCard label={t('pricing.grossProfit')} value={formatNumber(summary.grossProfit, 2)} />
      </div>

      {/* Standard margin tiers */}
      <Card className="overflow-x-auto p-0">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          {t('pricing.tiersTitle')}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">{t('pricing.margin')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('pricing.sellingPrice')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('pricing.grossProfit')}</th>
            </tr>
          </thead>
          <tbody>
            {result.pricingTiers.map((tier) => {
              const isTarget = Math.abs(tier.margin - targetMargin) < 1e-9
              return (
                <tr
                  key={tier.margin}
                  className={
                    'border-b border-border last:border-0 ' +
                    (isTarget ? 'bg-primary/10 font-medium' : 'hover:bg-surface-2')
                  }
                >
                  <td className="px-4 py-3">{formatPercent(tier.margin, 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(tier.sellingPrice, 2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(tier.grossProfit, 2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
