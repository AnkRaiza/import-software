// Quotations (Cotizaciones) — client-facing price quotes. Reuses the product
// catalog for line items but with custom quantities and selling prices, and
// exports a professional PDF.

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Copy, Download, FilePlus2, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { repo, type NewEntity } from '../../lib/repo'
import { CURRENCIES, type Currency, type Quotation, type QuotationItem } from '../../lib/db/types'
import { computeQuotationTotals, quotationLineTotal } from '../../lib/calc/quotation'
import { formatMoney } from '../../lib/calc/money'
import { getCompanyProfile } from '../../lib/settings'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Card, EmptyState, PageHeader } from '../../components/ui'

function nextQuotationNumber(existing: Quotation[]): string {
  const year = new Date().getFullYear()
  const prefix = `COT-${year}-`
  const nums = existing
    .filter((q) => q.number.startsWith(prefix))
    .map((q) => parseInt(q.number.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return prefix + String(next).padStart(3, '0')
}

const emptyLine = (): QuotationItem => ({ productId: '', sku: '', name: '', quantity: 1, unitPrice: 0 })

export default function QuotationsPage() {
  const { t } = useTranslation()
  const quotations = useLiveQuery(() => repo.quotations.all(), [])
  const [editor, setEditor] = useState<Quotation | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Quotation | undefined>()

  const money = useMoneyFormatter()

  if (editor) {
    return (
      <QuotationEditor
        initial={editor === 'new' ? undefined : editor}
        suggestedNumber={nextQuotationNumber(quotations ?? [])}
        onDone={() => setEditor(null)}
      />
    )
  }

  const duplicate = async (q: Quotation) => {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = q
    void _id; void _c; void _u
    await repo.quotations.create({ ...rest, number: nextQuotationNumber(quotations ?? []) })
  }

  const confirmDelete = async () => {
    if (deleting) await repo.quotations.remove(deleting.id)
    setDeleting(undefined)
  }

  const download = async (q: Quotation) => {
    const [{ generateQuotationPdf }, company] = await Promise.all([
      import('../../lib/pdf/quotationPdf'),
      getCompanyProfile(),
    ])
    generateQuotationPdf({
      quotation: q,
      company,
      t: (k) => t(`quotations.pdf.${k}`),
      money: (n) => money(n, q.currency),
    })
  }

  return (
    <>
      <PageHeader
        title={t('quotations.title')}
        subtitle={t('quotations.subtitle')}
        actions={
          <Button onClick={() => setEditor('new')}>
            <FilePlus2 className="size-4" />
            {t('quotations.new')}
          </Button>
        }
      />

      {quotations === undefined ? null : quotations.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-10" />}
          title={t('quotations.emptyTitle')}
          description={t('quotations.emptyDesc')}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">{t('quotations.col.number')}</th>
                <th className="px-4 py-3 font-medium">{t('quotations.col.date')}</th>
                <th className="px-4 py-3 font-medium">{t('quotations.col.client')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('quotations.col.total')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const totals = computeQuotationTotals(q.items, q.includeIgv, q.igvPct)
                return (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3 font-medium">{q.number}</td>
                    <td className="px-4 py-3 text-muted">{q.date}</td>
                    <td className="px-4 py-3">{q.clientName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(totals.total, q.currency)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => download(q)} aria-label={t('quotations.downloadPdf')}>
                          <Download className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditor(q)} aria-label={t('common.edit')}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => duplicate(q)} aria-label={t('history.duplicate')}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(q)} aria-label={t('common.delete')}>
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
      )}

      <ConfirmDialog
        open={!!deleting}
        title={t('quotations.deleteTitle')}
        message={t('quotations.deleteMessage', { name: deleting?.number })}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(undefined)}
      />
    </>
  )
}

/** Currency formatter that follows the current UI language. */
function useMoneyFormatter() {
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('es') ? 'es-PE' : 'en-US'
  return (value: number, currency: Currency) => formatMoney(value, currency, locale)
}

function QuotationEditor({
  initial,
  suggestedNumber,
  onDone,
}: {
  initial?: Quotation
  suggestedNumber: string
  onDone: () => void
}) {
  const { t } = useTranslation()
  const money = useMoneyFormatter()
  const products = useLiveQuery(() => repo.products.all(), [])

  const today = new Date().toISOString().slice(0, 10)
  const [number, setNumber] = useState(initial?.number ?? suggestedNumber)
  const [date, setDate] = useState(initial?.date ?? today)
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? '')
  const [clientName, setClientName] = useState(initial?.clientName ?? '')
  const [clientCompany, setClientCompany] = useState(initial?.clientCompany ?? '')
  const [clientContact, setClientContact] = useState(initial?.clientContact ?? '')
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'PEN')
  const [includeIgv, setIncludeIgv] = useState(initial?.includeIgv ?? true)
  const [igvPct, setIgvPct] = useState(initial?.igvPct ?? 18)
  const [items, setItems] = useState<QuotationItem[]>(initial?.items ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const totals = computeQuotationTotals(items, includeIgv, igvPct)

  const build = (): NewEntity<Quotation> => ({
    number,
    date,
    validUntil: validUntil || undefined,
    clientName,
    clientCompany: clientCompany || undefined,
    clientContact: clientContact || undefined,
    currency,
    includeIgv,
    igvPct,
    items,
    notes: notes || undefined,
  })

  const save = async () => {
    if (initial) await repo.quotations.update(initial.id, build())
    else await repo.quotations.create(build())
    onDone()
  }

  const download = async () => {
    const [{ generateQuotationPdf }, company] = await Promise.all([
      import('../../lib/pdf/quotationPdf'),
      getCompanyProfile(),
    ])
    generateQuotationPdf({
      quotation: { ...build(), id: initial?.id ?? '', createdAt: '', updatedAt: '' },
      company,
      t: (k) => t(`quotations.pdf.${k}`),
      money: (n) => money(n, currency),
    })
  }

  const setProduct = (idx: number, productId: string) => {
    const p = products?.find((x) => x.id === productId)
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx ? { ...it, productId, sku: p?.sku ?? '', name: p?.name ?? it.name } : it,
      ),
    )
  }
  const patchItem = (idx: number, patch: Partial<QuotationItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const inputCls =
    'w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-primary'

  return (
    <>
      <PageHeader
        title={initial ? t('quotations.edit') : t('quotations.new')}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onDone}>
              {t('common.cancel')}
            </Button>
            <Button variant="secondary" onClick={download}>
              <Download className="size-4" />
              {t('quotations.downloadPdf')}
            </Button>
            <Button onClick={save}>{t('common.save')}</Button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Meta + client */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t('quotations.number')}</span>
                <input value={number} onChange={(e) => setNumber(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t('quotations.date')}</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t('quotations.validUntil')}</span>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t('quotations.currency')}</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={inputCls}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 text-sm font-semibold">{t('quotations.clientTitle')}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">{t('quotations.clientName')}</span>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t('quotations.clientCompany')}</span>
                <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">{t('quotations.clientContact')}</span>
                <input value={clientContact} onChange={(e) => setClientContact(e.target.value)} className={inputCls} />
              </label>
            </div>
          </Card>
        </div>

        {/* Items */}
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">{t('quotations.product')}</th>
                <th className="px-4 py-3 font-medium">{t('quotations.description')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('quotations.quantity')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('quotations.unitPrice')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('quotations.lineTotal')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    {t('quotations.emptyLines')}
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <select value={it.productId ?? ''} onChange={(e) => setProduct(idx, e.target.value)} className={inputCls + ' min-w-40'}>
                        <option value="">{t('po.selectProduct')}</option>
                        {products?.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input value={it.name} onChange={(e) => patchItem(idx, { name: e.target.value })} className={inputCls + ' min-w-40'} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" step="any" min="0" value={it.quantity} onChange={(e) => patchItem(idx, { quantity: Number(e.target.value) || 0 })} className={inputCls + ' w-24 text-right'} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" step="any" min="0" value={it.unitPrice} onChange={(e) => patchItem(idx, { unitPrice: Number(e.target.value) || 0 })} className={inputCls + ' w-28 text-right'} />
                    </td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums">
                      {money(quotationLineTotal(it), currency)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))} aria-label={t('common.remove')}>
                        <Trash2 className="size-4 text-negative" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="border-t border-border p-3">
            <Button variant="secondary" size="sm" onClick={() => setItems((prev) => [...prev, emptyLine()])}>
              <Plus className="size-4" />
              {t('quotations.addLine')}
            </Button>
          </div>
        </Card>

        {/* Totals + notes */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <label className="mb-3 block">
              <span className="mb-1 block text-sm font-medium">{t('quotations.notes')}</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + ' min-h-24 resize-y'} />
            </label>
          </Card>
          <Card>
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeIgv} onChange={(e) => setIncludeIgv(e.target.checked)} />
              {t('quotations.includeIgv')}
              {includeIgv && (
                <input type="number" step="any" min="0" value={igvPct} onChange={(e) => setIgvPct(Number(e.target.value) || 0)} className={inputCls + ' ml-2 w-20 text-right'} />
              )}
            </label>
            <div className="space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t('quotations.subtotal')}</span>
                <span className="tabular-nums">{money(totals.subtotal, currency)}</span>
              </div>
              {includeIgv && (
                <div className="flex justify-between">
                  <span className="text-muted">{t('quotations.igv')}</span>
                  <span className="tabular-nums">{money(totals.igv, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>{t('quotations.total')}</span>
                <span className="tabular-nums text-primary">{money(totals.total, currency)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
