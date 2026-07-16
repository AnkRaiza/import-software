// Import History — lists every saved import with computed metrics, lets you
// open (activate), duplicate, or delete one, and compare several side by side.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Copy, ExternalLink, FilePlus2, History, Trash2 } from 'lucide-react'
import { repo } from '../../lib/repo'
import type { ImportRecord } from '../../lib/db/types'
import { useActiveImport } from '../../lib/activeImport'
import { calculateImport, type ImportSummary } from '../../lib/calc/engine'
import { formatNumber } from '../../lib/calc/money'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Card, EmptyState, PageHeader } from '../../components/ui'

const summaryOf = (imp: ImportRecord): ImportSummary =>
  calculateImport({
    items: imp.items,
    logistics: imp.logistics,
    taxes: imp.taxes,
    allocationMethod: imp.allocationMethod,
    targetMargin: imp.targetMargin,
  }).summary

export default function ImportHistoryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeId, imports, setActive, createNew } = useActiveImport()
  const suppliers = useLiveQuery(() => repo.suppliers.all(), [])
  const [deleting, setDeleting] = useState<ImportRecord | undefined>()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const supplierName = (id?: string) =>
    (id && suppliers?.find((s) => s.id === id)?.company) || t('common.none')

  const open = (imp: ImportRecord) => {
    setActive(imp.id)
    navigate('/allocation')
  }

  const duplicate = async (imp: ImportRecord) => {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = imp
    void _id
    void _c
    void _u
    await repo.imports.create({ ...rest, name: rest.name + t('history.copySuffix') })
  }

  const confirmDelete = async () => {
    if (deleting) {
      await repo.imports.remove(deleting.id)
      if (activeId === deleting.id) setActive(null)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(deleting.id)
        return next
      })
    }
    setDeleting(undefined)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const newImport = async () => {
    await createNew()
    navigate('/purchase-order')
  }

  const compareList = (imports ?? []).filter((i) => selected.has(i.id))

  return (
    <>
      <PageHeader
        title={t('modules.history.title')}
        subtitle={t('modules.history.subtitle')}
        actions={
          <Button onClick={newImport}>
            <FilePlus2 className="size-4" />
            {t('imports.new')}
          </Button>
        }
      />

      {imports === undefined ? null : imports.length === 0 ? (
        <EmptyState
          icon={<History className="size-10" />}
          title={t('history.emptyTitle')}
          description={t('history.emptyDesc')}
        />
      ) : (
        <div className="space-y-4">
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-3 font-medium">{t('history.compare')}</th>
                  <th className="px-4 py-3 font-medium">{t('history.col.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('history.col.date')}</th>
                  <th className="px-4 py-3 font-medium">{t('history.col.supplier')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('history.col.fob')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('history.col.logistics')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('history.col.taxes')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('history.col.total')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => {
                  const s = summaryOf(imp)
                  const isActive = imp.id === activeId
                  return (
                    <tr
                      key={imp.id}
                      className="border-b border-border last:border-0 hover:bg-surface-2"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(imp.id)}
                          onChange={() => toggleSelect(imp.id)}
                          aria-label={t('history.compare')}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => open(imp)}
                          className="font-medium text-primary hover:underline"
                        >
                          {imp.name}
                        </button>
                        {isActive && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {t('history.active')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">{imp.date}</td>
                      <td className="px-4 py-3 text-muted">{supplierName(imp.supplierId)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatNumber(s.totalFob, 2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatNumber(s.totalLogistics, 2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatNumber(s.totalTaxes, 2)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{formatNumber(s.totalLandedCost, 2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => open(imp)} aria-label={t('history.open')}>
                            <ExternalLink className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => duplicate(imp)} aria-label={t('history.duplicate')}>
                            <Copy className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(imp)} aria-label={t('common.delete')}>
                            <Trash2 className="size-4 text-negative" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          {compareList.length >= 2 && <ComparisonPanel imports={compareList} />}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title={t('history.deleteTitle')}
        message={t('history.deleteMessage', { name: deleting?.name })}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(undefined)}
      />
    </>
  )
}

function ComparisonPanel({ imports }: { imports: ImportRecord[] }) {
  const { t } = useTranslation()
  const cols = imports.map((imp) => ({ imp, s: summaryOf(imp) }))

  const rows: { key: string; get: (s: ImportSummary) => number; dp: number }[] = [
    { key: 'fob', get: (s) => s.totalFob, dp: 2 },
    { key: 'logistics', get: (s) => s.totalLogistics, dp: 2 },
    { key: 'taxes', get: (s) => s.totalTaxes, dp: 2 },
    { key: 'landed', get: (s) => s.totalLandedCost, dp: 2 },
    { key: 'avgUnit', get: (s) => s.avgCostPerUnit, dp: 4 },
    { key: 'avgM2', get: (s) => s.avgCostPerM2, dp: 4 },
    { key: 'units', get: (s) => s.totalUnits, dp: 0 },
    { key: 'weight', get: (s) => s.totalWeight, dp: 2 },
    { key: 'area', get: (s) => s.totalArea, dp: 4 },
  ]

  return (
    <Card className="overflow-x-auto">
      <h2 className="mb-4 text-sm font-semibold">{t('history.compareTitle')}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-2 font-medium" />
            {cols.map(({ imp }) => (
              <th key={imp.id} className="px-4 py-2 text-right font-medium">
                {imp.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border last:border-0">
              <td className="px-4 py-2 text-muted">{t(`history.m.${row.key}`)}</td>
              {cols.map(({ imp, s }) => (
                <td key={imp.id} className="px-4 py-2 text-right tabular-nums">
                  {formatNumber(row.get(s), row.dp)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
