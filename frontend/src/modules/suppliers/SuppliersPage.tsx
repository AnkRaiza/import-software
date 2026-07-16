// Suppliers — full CRUD. First module wired end-to-end through the repository,
// proving the data layer (create/read/update/delete + live query).

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Pencil, PackageSearch, Plus, Trash2 } from 'lucide-react'
import { repo, type NewEntity } from '../../lib/repo'
import type { Supplier } from '../../lib/db/types'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { Card, EmptyState, PageHeader } from '../../components/ui'
import { SUPPLIER_FORM_ID, SupplierForm } from './SupplierForm'

export default function SuppliersPage() {
  const { t } = useTranslation()
  const suppliers = useLiveQuery(() => repo.suppliers.all(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | undefined>()
  const [deleting, setDeleting] = useState<Supplier | undefined>()

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }
  const openEdit = (s: Supplier) => {
    setEditing(s)
    setFormOpen(true)
  }

  const handleSubmit = async (values: NewEntity<Supplier>) => {
    if (editing) await repo.suppliers.update(editing.id, values)
    else await repo.suppliers.create(values)
    setFormOpen(false)
    setEditing(undefined)
  }

  const confirmDelete = async () => {
    if (deleting) await repo.suppliers.remove(deleting.id)
    setDeleting(undefined)
  }

  return (
    <>
      <PageHeader
        title={t('suppliers.title')}
        subtitle={t('suppliers.subtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('suppliers.add')}
          </Button>
        }
      />

      {suppliers === undefined ? null : suppliers.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-10" />}
          title={t('suppliers.emptyTitle')}
          description={t('suppliers.emptyDesc')}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">{t('suppliers.col.company')}</th>
                <th className="px-4 py-3 font-medium">{t('suppliers.col.contact')}</th>
                <th className="px-4 py-3 font-medium">{t('suppliers.col.country')}</th>
                <th className="px-4 py-3 font-medium">{t('suppliers.col.currency')}</th>
                <th className="px-4 py-3 font-medium">{t('suppliers.col.incoterms')}</th>
                <th className="px-4 py-3 font-medium">{t('suppliers.col.paymentTerms')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-3 font-medium">{s.company}</td>
                  <td className="px-4 py-3 text-muted">{s.contact || t('common.none')}</td>
                  <td className="px-4 py-3 text-muted">{s.country || t('common.none')}</td>
                  <td className="px-4 py-3">{s.currency}</td>
                  <td className="px-4 py-3 text-muted">{s.incoterms || t('common.none')}</td>
                  <td className="px-4 py-3 text-muted">
                    {s.paymentTerms || t('common.none')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                        aria-label={`${t('common.edit')} ${s.company}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(s)}
                        aria-label={`${t('common.delete')} ${s.company}`}
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
        title={editing ? t('suppliers.edit') : t('suppliers.add')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form={SUPPLIER_FORM_ID}>
              {editing ? t('common.saveChanges') : t('suppliers.add')}
            </Button>
          </>
        }
      >
        {/* Remount the form when switching records so defaults reset. */}
        <SupplierForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={t('suppliers.deleteTitle')}
        message={t('suppliers.deleteMessage', { name: deleting?.company })}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(undefined)}
      />
    </>
  )
}
