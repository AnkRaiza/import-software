// Purchase Order — builds the line items of the active import. Unit price,
// area and weight are auto-retrieved from the catalog; FOB and all totals are
// calculated, never entered manually (PRD rule).

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Boxes, Plus, Save, Trash2 } from 'lucide-react'
import { repo } from '../../lib/repo'
import type { ImportRecord, Product, PurchaseOrderItem, Supplier } from '../../lib/db/types'
import { useActiveImport } from '../../lib/activeImport'
import { computePurchaseOrderTotals, lineTotal } from '../../lib/calc/engine'
import { formatNumber } from '../../lib/calc/money'
import { Button } from '../../components/Button'
import { ImportSwitcher } from '../../components/ImportSwitcher'
import { Card, EmptyState, PageHeader } from '../../components/ui'

const emptyLine = (): PurchaseOrderItem => ({
  productId: '',
  sku: '',
  name: '',
  quantity: 1,
  unitFobPrice: 0,
  area: 0,
  weight: 0,
})

export default function PurchaseOrderPage() {
  const { t } = useTranslation()
  const { active } = useActiveImport()
  const products = useLiveQuery(() => repo.products.all(), [])

  return (
    <>
      <PageHeader
        title={t('modules.purchaseOrder.title')}
        subtitle={t('modules.purchaseOrder.subtitle')}
      />
      <ImportSwitcher />

      {products !== undefined && products.length === 0 ? (
        <EmptyState
          icon={<Boxes className="size-10" />}
          title={t('products.emptyTitle')}
          description={t('po.needProducts')}
        />
      ) : !active ? (
        <EmptyState title={t('imports.none')} description={t('imports.chooseOrCreate')} />
      ) : (
        <POEditor
          key={active.id}
          importRecord={active}
          products={products ?? []}
        />
      )}
    </>
  )
}

function POEditor({
  importRecord,
  products,
}: {
  importRecord: ImportRecord
  products: Product[]
}) {
  const { t } = useTranslation()
  const suppliers = useLiveQuery(() => repo.suppliers.all(), [])
  const [supplierId, setSupplierId] = useState(importRecord.supplierId ?? '')
  const [items, setItems] = useState<PurchaseOrderItem[]>(importRecord.items ?? [])
  const [saved, setSaved] = useState(true)

  const totals = computePurchaseOrderTotals(items)

  const touch = () => setSaved(false)

  const addLine = () => {
    setItems((prev) => [...prev, emptyLine()])
    touch()
  }
  const removeLine = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
    touch()
  }
  const setProduct = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId)
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? {
              ...it,
              productId,
              sku: p?.sku ?? '',
              name: p?.name ?? '',
              unitFobPrice: p?.unitFobPrice ?? 0,
              area: p?.area ?? 0,
              weight: p?.weight ?? 0,
            }
          : it,
      ),
    )
    touch()
  }
  const setQuantity = (idx: number, quantity: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, quantity } : it)),
    )
    touch()
  }

  const save = async () => {
    await repo.imports.update(importRecord.id, {
      supplierId: supplierId || undefined,
      items,
    })
    setSaved(true)
  }

  return (
    <div className="space-y-4">
      {/* Supplier + save toolbar */}
      <Card className="flex flex-wrap items-end justify-between gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t('po.supplier')}</span>
          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value)
              touch()
            }}
            className="min-w-56 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">{t('products.noSupplier')}</option>
            {suppliers?.map((s: Supplier) => (
              <option key={s.id} value={s.id}>
                {s.company}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-positive">{t('common.saved')}</span>}
          <Button onClick={save} disabled={saved}>
            <Save className="size-4" />
            {t('common.save')}
          </Button>
        </div>
      </Card>

      {/* Line items */}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">{t('po.product')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('po.quantity')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('po.unitFob')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('po.unitArea')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('po.unitWeight')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('po.lineTotal')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  {t('po.emptyLines')}
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={idx} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    <select
                      value={it.productId}
                      onChange={(e) => setProduct(idx, e.target.value)}
                      className="w-full min-w-44 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary"
                    >
                      <option value="">{t('po.selectProduct')}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={it.quantity}
                      onChange={(e) => setQuantity(idx, Number(e.target.value) || 0)}
                      className="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">
                    {formatNumber(it.unitFobPrice, 2)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">
                    {formatNumber(it.area, 4)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">
                    {formatNumber(it.weight, 2)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    {formatNumber(lineTotal(it), 2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(idx)}
                      aria-label={t('common.remove')}
                    >
                      <Trash2 className="size-4 text-negative" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="border-t border-border p-3">
          <Button variant="secondary" size="sm" onClick={addLine}>
            <Plus className="size-4" />
            {t('po.addLine')}
          </Button>
        </div>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TotalCard label={t('po.totalQuantity')} value={formatNumber(totals.totalQuantity, 0)} />
        <TotalCard label={t('po.totalWeight')} value={formatNumber(totals.totalWeight, 2)} />
        <TotalCard label={t('po.totalArea')} value={formatNumber(totals.totalArea, 4)} />
        <TotalCard
          label={t('po.fobTotal')}
          value={formatNumber(totals.fobTotal, 2)}
          emphasis
        />
      </div>
      <p className="text-xs text-muted">{t('po.fobNote')}</p>
    </div>
  )
}

function TotalCard({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div
        className={
          'mt-1 text-xl font-semibold tabular-nums ' +
          (emphasis ? 'text-primary' : '')
        }
      >
        {value}
      </div>
    </Card>
  )
}
