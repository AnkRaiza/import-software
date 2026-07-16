// Customs (SUNAT) — tax-rate inputs with a live customs breakdown. Combines the
// active import's FOB (from the Purchase Order) and logistics to compute CIF,
// then Ad Valorem / IGV / IPM / Perception via the tested computeCustoms.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { repo } from '../../lib/repo'
import type { ImportRecord, TaxProfile } from '../../lib/db/types'
import { useActiveImport } from '../../lib/activeImport'
import { computeCustoms, computePurchaseOrderTotals } from '../../lib/calc/engine'
import { d, formatNumber } from '../../lib/calc/money'
import { Button } from '../../components/Button'
import { ImportSwitcher } from '../../components/ImportSwitcher'
import { Card, EmptyState, PageHeader } from '../../components/ui'

const INPUT_FIELDS: (keyof TaxProfile)[] = [
  'exchangeRate',
  'adValoremPct',
  'igvPct',
  'ipmPct',
  'perceptionPct',
]

// Map data field → i18n key under customs.in
const IN_KEY: Record<keyof TaxProfile, string> = {
  exchangeRate: 'exchangeRate',
  adValoremPct: 'adValorem',
  igvPct: 'igv',
  ipmPct: 'ipm',
  perceptionPct: 'perception',
}

export default function CustomsPage() {
  const { t } = useTranslation()
  const { active } = useActiveImport()

  return (
    <>
      <PageHeader
        title={t('modules.customs.title')}
        subtitle={t('modules.customs.subtitle')}
      />
      <ImportSwitcher />

      {!active ? (
        <EmptyState title={t('imports.none')} description={t('imports.chooseOrCreate')} />
      ) : (
        <CustomsEditor key={active.id} importRecord={active} />
      )}
    </>
  )
}

function CustomsEditor({ importRecord }: { importRecord: ImportRecord }) {
  const { t } = useTranslation()
  const [taxes, setTaxes] = useState<TaxProfile>(importRecord.taxes)
  const [saved, setSaved] = useState(true)

  const fobTotal = computePurchaseOrderTotals(importRecord.items).fobTotal
  const c = computeCustoms(d(fobTotal), importRecord.logistics, taxes)
  const penTotal = d(c.totalTaxes).times(d(taxes.exchangeRate)).toNumber()

  const setField = (field: keyof TaxProfile, value: number) => {
    setTaxes((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const save = async () => {
    await repo.imports.update(importRecord.id, { taxes })
    setSaved(true)
  }

  const rows: { key: string; value: number; emphasis?: boolean }[] = [
    { key: 'fob', value: fobTotal },
    { key: 'cif', value: c.cif },
    { key: 'taxBase', value: c.taxBase },
    { key: 'adValorem', value: c.adValorem },
    { key: 'igv', value: c.igv },
    { key: 'ipm', value: c.ipm },
    { key: 'perception', value: c.perception },
    { key: 'total', value: c.totalTaxes, emphasis: true },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-positive">{t('common.saved')}</span>}
        <Button onClick={save} disabled={saved}>
          <Save className="size-4" />
          {t('common.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Inputs */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold">{t('customs.inputsTitle')}</h2>
          <div className="space-y-3">
            {INPUT_FIELDS.map((field) => (
              <label key={field} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">
                  {t(`customs.in.${IN_KEY[field]}`)}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={taxes[field]}
                  onChange={(e) => setField(field, Number(e.target.value) || 0)}
                  className="w-32 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
        </Card>

        {/* Breakdown */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold">{t('customs.breakdownTitle')}</h2>
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.key}
                className={
                  'flex items-center justify-between ' +
                  (row.emphasis
                    ? 'mt-2 border-t border-border pt-3 text-base font-semibold'
                    : 'text-sm')
                }
              >
                <span className={row.emphasis ? '' : 'text-muted'}>
                  {t(`customs.out.${row.key}`)}
                </span>
                <span
                  className={
                    'tabular-nums ' + (row.emphasis ? 'text-primary' : '')
                  }
                >
                  {formatNumber(row.value, 2)}
                </span>
              </div>
            ))}
            <div className="pt-1 text-right text-xs text-muted">
              {t('customs.penEquiv', { value: formatNumber(penTotal, 2) })}
            </div>
          </div>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
            {t('customs.cifNote')}
          </p>
        </Card>
      </div>
    </div>
  )
}
