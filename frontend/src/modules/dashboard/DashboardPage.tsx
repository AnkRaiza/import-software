// Dashboard — executive KPI overview aggregated across all stored imports.
// Demonstrates the full stack end-to-end: repository → calc engine → UI.

import { useLiveQuery } from 'dexie-react-hooks'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard } from 'lucide-react'
import { repo } from '../../lib/repo'
import { calculateImport } from '../../lib/calc/engine'
import { formatMoney, formatNumber, formatPercent } from '../../lib/calc/money'
import { Card, EmptyState, PageHeader } from '../../components/ui'

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </Card>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const imports = useLiveQuery(() => repo.imports.all(), [])

  if (imports === undefined) return null // loading

  if (imports.length === 0) {
    return (
      <>
        <PageHeader
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
        />
        <EmptyState
          icon={<LayoutDashboard className="size-10" />}
          title={t('dashboard.emptyTitle')}
          description={t('dashboard.emptyDesc')}
        />
      </>
    )
  }

  // Aggregate KPIs across every stored import.
  const results = imports.map((imp) =>
    calculateImport({
      items: imp.items,
      logistics: imp.logistics,
      taxes: imp.taxes,
      allocationMethod: imp.allocationMethod,
      targetMargin: imp.targetMargin,
    }),
  )

  const totals = results.reduce(
    (acc, r) => ({
      fob: acc.fob + r.summary.totalFob,
      logistics: acc.logistics + r.summary.totalLogistics,
      taxes: acc.taxes + r.summary.totalTaxes,
      landed: acc.landed + r.summary.totalLandedCost,
      units: acc.units + r.summary.totalUnits,
      area: acc.area + r.summary.totalArea,
      selling: acc.selling + r.summary.suggestedSellingPrice,
    }),
    { fob: 0, logistics: 0, taxes: 0, landed: 0, units: 0, area: 0, selling: 0 },
  )

  const avgPerUnit = totals.units ? totals.landed / totals.units : 0
  const avgPerM2 = totals.area ? totals.landed / totals.area : 0
  const grossMargin = totals.selling
    ? (totals.selling - totals.landed) / totals.selling
    : 0

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.aggregated', { count: imports.length })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('dashboard.kpi.totalFob')} value={formatMoney(totals.fob)} />
        <KpiCard
          label={t('dashboard.kpi.logistics')}
          value={formatMoney(totals.logistics)}
        />
        <KpiCard
          label={t('dashboard.kpi.taxes')}
          value={formatMoney(totals.taxes)}
        />
        <KpiCard
          label={t('dashboard.kpi.landed')}
          value={formatMoney(totals.landed)}
        />
        <KpiCard
          label={t('dashboard.kpi.avgUnit')}
          value={formatMoney(avgPerUnit)}
          hint={t('dashboard.unitsHint', { value: formatNumber(totals.units, 0) })}
        />
        <KpiCard
          label={t('dashboard.kpi.avgM2')}
          value={formatMoney(avgPerM2)}
          hint={t('dashboard.areaHint', { value: formatNumber(totals.area, 2) })}
        />
        <KpiCard
          label={t('dashboard.kpi.selling')}
          value={formatMoney(totals.selling)}
        />
        <KpiCard
          label={t('dashboard.kpi.margin')}
          value={formatPercent(grossMargin)}
        />
      </div>
    </>
  )
}
