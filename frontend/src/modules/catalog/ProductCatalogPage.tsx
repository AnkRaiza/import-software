// Product Catalog — full CRUD over the reusable product list, with a live
// supplier lookup for display.

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react'
import { repo, type NewEntity } from '../../lib/repo'
import { FINISH_LABEL_KEYS, type Product } from '../../lib/db/types'
import { formatNumber } from '../../lib/calc/money'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { Card, EmptyState, PageHeader } from '../../components/ui'
import { PRODUCT_FORM_ID, ProductForm } from './ProductForm'

export default function ProductCatalogPage() {
  const { t } = useTranslation()
  const products = useLiveQuery(() => repo.products.all(), [])
  const suppliers = useLiveQuery(() => repo.suppliers.all(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>()
  const [deleting, setDeleting] = useState<Product | undefined>()

  const supplierName = (id?: string) =>
    (id && suppliers?.find((s) => s.id === id)?.company) || t('products.noSupplier')

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (p: Product) => {
    setEditing(p)
    setFormOpen(true)
  }

  const handleSubmit = async (values: NewEntity<Product>) => {
    if (editing) await repo.products.update(editing.id, values)
    else await repo.products.create(values)
    setFormOpen(false)
    setEditing(undefined)
  }

  const confirmDelete = async () => {
    if (deleting) await repo.products.remove(deleting.id)
    setDeleting(undefined)
  }

  return (
    <>
      <PageHeader
        title={t('modules.products.title')}
        subtitle={t('modules.products.subtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('products.add')}
          </Button>
        }
      />

      {products === undefined ? null : products.length === 0 ? (
        <EmptyState
          icon={<Boxes className="size-10" />}
          title={t('products.emptyTitle')}
          description={t('products.emptyDesc')}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">{t('products.col.sku')}</th>
                <th className="px-4 py-3 font-medium">{t('products.col.name')}</th>
                <th className="px-4 py-3 font-medium">{t('products.col.finish')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('products.col.area')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('products.col.weight')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('products.col.fob')}</th>
                <th className="px-4 py-3 font-medium">{t('products.col.supplier')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3 font-medium">{p.sku}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {p.finish ? t(FINISH_LABEL_KEYS[p.finish]) : t('common.none')}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(p.area, 4)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(p.weight, 2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatNumber(p.unitFobPrice, 2)}
                  </td>
                  <td className="px-4 py-3 text-muted">{supplierName(p.supplierId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(p)}
                        aria-label={`${t('common.edit')} ${p.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(p)}
                        aria-label={`${t('common.delete')} ${p.name}`}
                      >
                        <Trash2 className="size-4 text-negative" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('products.edit') : t('products.add')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form={PRODUCT_FORM_ID}>
              {editing ? t('common.saveChanges') : t('products.add')}
            </Button>
          </>
        }
      >
        <ProductForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={t('products.deleteTitle')}
        message={t('products.deleteMessage', { name: deleting?.name })}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(undefined)}
      />
    </>
  )
}
