// Cost Allocation — the integrative view. Runs the full calculateImport engine
// on the active import and shows the per-product landed-cost table. The chosen
// allocation method persists to the import and recomputes everything instantly.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { repo } from '../../lib/repo'
import {
  ALLOCATION_METHODS,
  type AllocationMethod,
  type ImportRecord,
} from '../../lib/db/types'
import { useActiveImport } from '../../lib/activeImport'
import { calculateImport } from '../../lib/calc/engine'
import { formatNumber } from '../../lib/calc/money'
import { ImportSwitcher } from '../../components/ImportSwitcher'
import { Card, EmptyState, PageHeader } from '../../components/ui'

export default function CostAllocationPage() {
  const { t } = useTranslation()
  const { active } = useActiveImport()

  return (
    <>
      <PageHeader
        title={t('modules.allocation.title')}
        subtitle={t('modules.allocation.subtitle')}
      />
      <ImportSwitcher />

      {!active ? (
        <EmptyState title={t('imports.none')} description={t('imports.chooseOrCreate')} />
      ) : (
        <AllocationView key={active.id} importRecord={active} />
      )}
    </>
  )
}

function AllocationView({ importRecord }: { importRecord: ImportRecord }) {
  const { t } = useTranslation()
  const [method, setMethod] = useState<AllocationMethod>(importRecord.allocationMethod)

  const changeMethod = async (m: AllocationMethod) => {
    setMethod(m)
    await repo.imports.update(importRecord.id, { allocationMethod: m })
  }

  const result = calculateImport({
    items: importRecord.items,
    logistics: importRecord.logistics,
    taxes: importRecord.taxes,
    allocationMethod: method,
    targetMargin: importRecord.targetMargin,
  })

  const { summary } = result

  if (importRecord.items.length === 0) {
    return (
      <EmptyState
        title={t('modules.allocation.title')}
        description={t('allocation.needLines')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">{t('allocation.method')}</label>
        <select
          value={method}
          onChange={(e) => changeMethod(e.target.value as AllocationMethod)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-primary"
        >
          {ALLOCATION_METHODS.map((m) => (
            <option key={m} value={m}>
              {t(`allocation.methods.${m}`)}
            </option>
          ))}
        </select>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">{t('allocation.col.product')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('allocation.col.fob')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('allocation.col.logistics')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('allocation.col.tax')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('allocation.col.landed')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('allocation.col.costPerUnit')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('allocation.col.costPerM2')}</th>
            </tr>
          </thead>
          <tbody>
            {result.allocations.map((a) => (
              <tr
                key={a.productId}
                className="border-b border-border last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-3">
                  <span className="font-medium">{a.sku}</span>{' '}
                  <span className="text-muted">— {a.name}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(a.fob, 2)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(a.logisticsAllocation, 2)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(a.taxAllocation, 2)}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatNumber(a.landedCost, 2)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(a.costPerUnit, 4)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(a.costPerM2, 4)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td className="px-4 py-3">{t('allocation.total')}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(summary.totalFob, 2)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(summary.totalLogistics, 2)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(summary.totalTaxes, 2)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-primary">
                {formatNumber(summary.totalLandedCost, 2)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(summary.avgCostPerUnit, 4)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(summary.avgCostPerM2, 4)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  )
}
