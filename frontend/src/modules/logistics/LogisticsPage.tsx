// Logistics — edits the active import's three cost sections (international,
// destination, customs broker) with live subtotals and a grand total.

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { repo } from '../../lib/repo'
import type { ImportRecord, LogisticsCosts } from '../../lib/db/types'
import { useActiveImport } from '../../lib/activeImport'
import { computeLogistics } from '../../lib/calc/engine'
import { formatNumber } from '../../lib/calc/money'
import { Button } from '../../components/Button'
import { ImportSwitcher } from '../../components/ImportSwitcher'
import { Card, EmptyState, PageHeader } from '../../components/ui'

type SectionKey = keyof LogisticsCosts

const SECTIONS: { key: SectionKey; fields: string[] }[] = [
  { key: 'international', fields: ['oceanFreight', 'insurance', 'blService', 'other'] },
  {
    key: 'destination',
    fields: [
      'deconsolidation',
      'warehouse',
      'handling',
      'customsRelease',
      'monitoring',
      'portCharges',
      'other',
    ],
  },
  {
    key: 'broker',
    fields: ['brokerage', 'customsProcessing', 'localDelivery', 'miscellaneous'],
  },
]

export default function LogisticsPage() {
  const { t } = useTranslation()
  const { active } = useActiveImport()

  return (
    <>
      <PageHeader
        title={t('modules.logistics.title')}
        subtitle={t('modules.logistics.subtitle')}
      />
      <ImportSwitcher />

      {!active ? (
        <EmptyState title={t('imports.none')} description={t('imports.chooseOrCreate')} />
      ) : (
        <LogisticsEditor key={active.id} importRecord={active} />
      )}
    </>
  )
}

function LogisticsEditor({ importRecord }: { importRecord: ImportRecord }) {
  const { t } = useTranslation()
  const [logistics, setLogistics] = useState<LogisticsCosts>(importRecord.logistics)
  const [saved, setSaved] = useState(true)

  const subtotals = computeLogistics(logistics)

  const setField = (section: SectionKey, field: string, value: number) => {
    setLogistics(
      (prev) =>
        ({
          ...prev,
          [section]: { ...(prev[section] as Record<string, number>), [field]: value },
        }) as LogisticsCosts,
    )
    setSaved(false)
  }

  const save = async () => {
    await repo.imports.update(importRecord.id, { logistics })
    setSaved(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-positive">{t('common.saved')}</span>}
        <Button onClick={save} disabled={saved}>
          <Save className="size-4" />
          {t('common.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Card key={section.key}>
            <h2 className="mb-4 text-sm font-semibold">
              {t(`logistics.section.${section.key}`)}
            </h2>
            <div className="space-y-3">
              {section.fields.map((field) => (
                <label key={field} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">{t(`logistics.f.${field}`)}</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={(logistics[section.key] as Record<string, number>)[field]}
                    onChange={(e) =>
                      setField(section.key, field, Number(e.target.value) || 0)
                    }
                    className="w-32 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm font-medium">
              <span>{t('logistics.subtotal')}</span>
              <span className="tabular-nums">
                {formatNumber(subtotals[section.key], 2)}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('logistics.total')}
        </span>
        <span className="text-2xl font-semibold tabular-nums text-primary">
          {formatNumber(subtotals.total, 2)}
        </span>
      </Card>
    </div>
  )
}
