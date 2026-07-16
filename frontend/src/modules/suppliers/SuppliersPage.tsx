// Suppliers — full CRUD. First module wired end-to-end through the repository,
// proving the data layer (create/read/update/delete + live query).

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, PackageSearch, Plus, Trash2 } from 'lucide-react'
import { repo, type NewEntity } from '../../lib/repo'
import type { Supplier } from '../../lib/db/types'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { Card, EmptyState, PageHeader } from '../../components/ui'
import { SUPPLIER_FORM_ID, SupplierForm } from './SupplierForm'

export default function SuppliersPage() {
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
        title="Suppliers"
        subtitle="Manage supplier companies and trading terms"
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add Supplier
          </Button>
        }
      />

      {suppliers === undefined ? null : suppliers.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-10" />}
          title="No suppliers yet"
          description="Add your first supplier to start building purchase orders."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Currency</th>
                <th className="px-4 py-3 font-medium">Incoterms</th>
                <th className="px-4 py-3 font-medium">Payment Terms</th>
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
                  <td className="px-4 py-3 text-muted">{s.contact || '—'}</td>
                  <td className="px-4 py-3 text-muted">{s.country || '—'}</td>
                  <td className="px-4 py-3">{s.currency}</td>
                  <td className="px-4 py-3 text-muted">{s.incoterms || '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {s.paymentTerms || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                        aria-label={`Edit ${s.company}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(s)}
                        aria-label={`Delete ${s.company}`}
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
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={SUPPLIER_FORM_ID}>
              {editing ? 'Save Changes' : 'Add Supplier'}
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
        title="Delete supplier"
        message={`Delete "${deleting?.company}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(undefined)}
      />
    </>
  )
}
