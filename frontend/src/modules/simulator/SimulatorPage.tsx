// Scenario Simulator — adjust key inputs (exchange rate, freight, insurance,
// tax rates, quantities) and see landed cost + margins recalculate instantly
// against the saved base scenario. Non-destructive: nothing is saved unless the
// user explicitly saves the scenario as a new import.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RotateCcw, Save } from 'lucide-react'
import { repo } from '../../lib/repo'
import type { ImportRecord } from '../../lib/db/types'
import { useActiveImport } from '../../lib/activeImport'
import { calculateImport, type CalcInput } from '../../lib/calc/engine'
import { formatNumber, formatPercent } from '../../lib/calc/money'
import { Button } from '../../components/Button'
import { ImportSwitcher } from '../../components/ImportSwitcher'
import { Card, EmptyState, PageHeader } from '../../components/ui'

interface Scenario {
  exchangeRate: number
  oceanFreight: number
  insurance: number
  adValoremPct: number
  igvPct: number
  ipmPct: number
  perceptionPct: number
  targetMargin: number
  quantities: number[]
}

function scenarioFrom(imp: ImportRecord): Scenario {
  return {
    exchangeRate: imp.taxes.exchangeRate,
    oceanFreight: imp.logistics.international.oceanFreight,
    insurance: imp.logistics.international.insurance,
    adValoremPct: imp.taxes.adValoremPct,
    igvPct: imp.taxes.igvPct,
    ipmPct: imp.taxes.ipmPct,
    perceptionPct: imp.taxes.perceptionPct,
    targetMargin: imp.targetMargin ?? 0.3,
    quantities: imp.items.map((i) => i.quantity),
  }
}

function toInput(imp: ImportRecord, sc: Scenario): CalcInput {
  return {
    items: imp.items.map((it, i) => ({ ...it, quantity: sc.quantities[i] ?? it.quantity })),
    logistics: {
      ...imp.logistics,
      international: {
        ...imp.logistics.international,
        oceanFreight: sc.oceanFreight,
        insurance: sc.insurance,
      },
    },
    taxes: {
      exchangeRate: sc.exchangeRate,
      adValoremPct: sc.adValoremPct,
      igvPct: sc.igvPct,
      ipmPct: sc.ipmPct,
      perceptionPct: sc.perceptionPct,
    },
    allocationMethod: imp.allocationMethod,
    targetMargin: sc.targetMargin,
  }
}

export default function SimulatorPage() {
  const { t } = useTranslation()
  const { active } = useActiveImport()

  return (
    <>
      <PageHeader
        title={t('modules.simulator.title')}
        subtitle={t('modules.simulator.subtitle')}
      />
      <ImportSwitcher />

      {!active ? (
        <EmptyState title={t('imports.none')} description={t('imports.chooseOrCreate')} />
      ) : active.items.length === 0 ? (
        <EmptyState
          title={t('modules.simulator.title')}
          description={t('simulator.needLines')}
        />
      ) : (
        <Simulator key={active.id} importRecord={active} />
      )}
    </>
  )
}

function Simulator({ importRecord }: { importRecord: ImportRecord }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sc, setSc] = useState<Scenario>(() => scenarioFrom(importRecord))

  const base = calculateImport(toInput(importRecord, scenarioFrom(importRecord))).summary
  const scenario = calculateImport(toInput(importRecord, sc)).summary

  const set = (patch: Partial<Scenario>) => setSc((prev) => ({ ...prev, ...patch }))
  const setQty = (idx: number, value: number) =>
    setSc((prev) => ({
      ...prev,
      quantities: prev.quantities.map((q, i) => (i === idx ? value : q)),
    }))
  const reset = () => setSc(scenarioFrom(importRecord))

  const saveAsNew = async () => {
    const input = toInput(importRecord, sc)
    await repo.imports.create({
      name: importRecord.name + t('simulator.scenarioSuffix'),
      date: importRecord.date,
      supplierId: importRecord.supplierId,
      items: input.items,
      logistics: input.logistics,
      taxes: input.taxes,
      allocationMethod: input.allocationMethod,
      targetMargin: sc.targetMargin,
    })
    navigate('/history')
  }

  const numControls: { key: keyof Scenario; label: string; step?: string }[] = [
    { key: 'exchangeRate', label: t('customs.in.exchangeRate'), step: 'any' },
    { key: 'oceanFreight', label: t('logistics.f.oceanFreight'), step: 'any' },
    { key: 'insurance', label: t('logistics.f.insurance'), step: 'any' },
    { key: 'adValoremPct', label: t('customs.in.adValorem') },
    { key: 'igvPct', label: t('customs.in.igv') },
    { key: 'ipmPct', label: t('customs.in.ipm') },
    { key: 'perceptionPct', label: t('customs.in.perception') },
  ]

  const rows: {
    key: string
    base: number
    scen: number
    kind: 'money' | 'num4' | 'percent'
  }[] = [
    { key: 'fob', base: base.totalFob, scen: scenario.totalFob, kind: 'money' },
    { key: 'logistics', base: base.totalLogistics, scen: scenario.totalLogistics, kind: 'money' },
    { key: 'taxes', base: base.totalTaxes, scen: scenario.totalTaxes, kind: 'money' },
    { key: 'landed', base: base.totalLandedCost, scen: scenario.totalLandedCost, kind: 'money' },
    { key: 'avgUnit', base: base.avgCostPerUnit, scen: scenario.avgCostPerUnit, kind: 'num4' },
    { key: 'avgM2', base: base.avgCostPerM2, scen: scenario.avgCostPerM2, kind: 'num4' },
    { key: 'selling', base: base.suggestedSellingPrice, scen: scenario.suggestedSellingPrice, kind: 'money' },
    { key: 'margin', base: base.grossMargin, scen: scenario.grossMargin, kind: 'percent' },
  ]

  const fmt = (v: number, kind: 'money' | 'num4' | 'percent') =>
    kind === 'percent' ? formatPercent(v, 1) : formatNumber(v, kind === 'num4' ? 4 : 2)

  const fmtDelta = (delta: number, kind: 'money' | 'num4' | 'percent') => {
    const sign = delta > 0 ? '+' : ''
    return sign + fmt(delta, kind)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Controls */}
      <div className="space-y-4">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t('simulator.controlsTitle')}</h2>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-4" />
              {t('simulator.reset')}
            </Button>
          </div>
          <div className="space-y-3">
            {numControls.map((c) => (
              <label key={c.key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">{c.label}</span>
                <input
                  type="number"
                  step={c.step ?? '0.1'}
                  min="0"
                  value={sc[c.key] as number}
                  onChange={(e) => set({ [c.key]: Number(e.target.value) || 0 } as Partial<Scenario>)}
                  className="w-32 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">{t('pricing.targetMargin')}</span>
              <input
                type="number"
                step="1"
                min="0"
                max="99"
                value={Math.round(sc.targetMargin * 100)}
                onChange={(e) =>
                  set({ targetMargin: Math.min(Math.max((Number(e.target.value) || 0) / 100, 0), 0.99) })
                }
                className="w-32 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold">{t('simulator.quantitiesTitle')}</h2>
          <div className="space-y-3">
            {importRecord.items.map((it, idx) => (
              <label key={idx} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">
                  {it.sku} — {it.name}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={sc.quantities[idx]}
                  onChange={(e) => setQty(idx, Number(e.target.value) || 0)}
                  className="w-28 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Comparison */}
      <Card className="overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('modules.simulator.title')}</h2>
          <Button size="sm" onClick={saveAsNew}>
            <Save className="size-4" />
            {t('simulator.saveAsNew')}
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium" />
              <th className="px-3 py-2 text-right font-medium">{t('simulator.base')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('simulator.scenario')}</th>
              <th className="px-3 py-2 text-right font-medium">{t('simulator.delta')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = r.scen - r.base
              return (
                <tr key={r.key} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-muted">{t(`simulator.m.${r.key}`)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(r.base, r.kind)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {fmt(r.scen, r.kind)}
                  </td>
                  <td
                    className={
                      'px-3 py-2 text-right tabular-nums ' +
                      (Math.abs(delta) < 1e-9 ? 'text-muted' : '')
                    }
                  >
                    {Math.abs(delta) < 1e-9 ? '—' : fmtDelta(delta, r.kind)}
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
