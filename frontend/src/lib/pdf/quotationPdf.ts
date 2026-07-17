// Quotation PDF generation (client-side, jsPDF + autotable). One-click download.

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CompanyProfile, Quotation } from '../db/types'
import { computeQuotationTotals, quotationLineTotal } from '../calc/quotation'

export interface QuotationPdfDeps {
  quotation: Quotation
  company?: CompanyProfile
  /** Translator scoped to quotations.pdf.* keys. */
  t: (key: string) => string
  /** Currency formatter for the quotation's currency. */
  money: (value: number) => string
}

export function generateQuotationPdf({ quotation, company, t, money }: QuotationPdfDeps) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 14
  const top = 16
  let leftY = top
  let rightY = top

  // --- Header: logo + company (left), document title (right) ---
  if (company?.logo) {
    try {
      const props = doc.getImageProperties(company.logo)
      const maxH = 18
      const maxW = 55
      let h = maxH
      let w = (props.width / props.height) * h
      if (w > maxW) {
        w = maxW
        h = (props.height / props.width) * w
      }
      doc.addImage(company.logo, props.fileType || 'PNG', marginX, leftY, w, h)
      leftY += h + 5
    } catch {
      // Ignore an unreadable image and continue without the logo.
    }
  }

  if (company) {
    doc.setFont('helvetica', 'bold').setFontSize(14)
    leftY += 2
    doc.text(company.name, marginX, leftY)
    doc.setFont('helvetica', 'normal').setFontSize(9)
    const line = (label: string, value?: string) => {
      if (!value) return
      leftY += 4.5
      doc.text(`${label}: ${value}`, marginX, leftY)
    }
    line(t('ruc'), company.ruc)
    if (company.address) {
      leftY += 4.5
      doc.text(company.address, marginX, leftY)
    }
    line(t('phone'), company.phone)
    line(t('email'), company.email)
  }

  doc.setFont('helvetica', 'bold').setFontSize(18)
  doc.text(t('title'), pageWidth - marginX, rightY + 2, { align: 'right' })
  doc.setFont('helvetica', 'normal').setFontSize(10)
  rightY += 9
  doc.text(`${t('number')}: ${quotation.number}`, pageWidth - marginX, rightY, { align: 'right' })
  rightY += 5
  doc.text(`${t('date')}: ${quotation.date}`, pageWidth - marginX, rightY, { align: 'right' })
  if (quotation.validUntil) {
    rightY += 5
    doc.text(`${t('validUntil')}: ${quotation.validUntil}`, pageWidth - marginX, rightY, {
      align: 'right',
    })
  }

  // --- Client block (below whichever header column is taller) ---
  let y = Math.max(leftY, rightY) + 10
  doc.setFont('helvetica', 'bold').setFontSize(10)
  doc.text(t('billTo'), marginX, y)
  doc.setFont('helvetica', 'normal').setFontSize(10)
  y += 5
  doc.text(quotation.clientName, marginX, y)
  if (quotation.clientCompany) {
    y += 4.5
    doc.text(quotation.clientCompany, marginX, y)
  }
  if (quotation.clientContact) {
    y += 4.5
    doc.text(quotation.clientContact, marginX, y)
  }

  // --- Items table ---
  const totals = computeQuotationTotals(quotation.items, quotation.includeIgv, quotation.igvPct)
  autoTable(doc, {
    startY: y + 8,
    head: [[t('description'), t('qty'), t('unitPrice'), t('amount')]],
    body: quotation.items.map((it) => [
      it.name,
      String(it.quantity),
      money(it.unitPrice),
      money(quotationLineTotal(it)),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], halign: 'left' },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 32 },
      3: { halign: 'right', cellWidth: 34 },
    },
    margin: { left: marginX, right: marginX },
  })

  // --- Totals ---
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  let ty = finalY + 8
  const labelX = pageWidth - marginX - 40
  const valueX = pageWidth - marginX
  doc.setFontSize(10)
  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(label, labelX, ty, { align: 'right' })
    doc.text(value, valueX, ty, { align: 'right' })
    ty += 5.5
  }
  totalRow(t('subtotal'), money(totals.subtotal))
  if (quotation.includeIgv) totalRow(`${t('igv')} (${quotation.igvPct}%)`, money(totals.igv))
  totalRow(t('total'), money(totals.total), true)

  // --- Notes ---
  if (quotation.notes) {
    ty += 6
    doc.setFont('helvetica', 'bold').setFontSize(9)
    doc.text(t('notes'), marginX, ty)
    doc.setFont('helvetica', 'normal')
    ty += 5
    const wrapped = doc.splitTextToSize(quotation.notes, pageWidth - marginX * 2)
    doc.text(wrapped, marginX, ty)
  }

  doc.save(`${quotation.number}.pdf`)
}
