import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Invoice, InvoiceItem } from '../services/invoices'
import type { Payment } from '../services/payments'
import { drawBrandHeader } from './brandAssets'

const STATUS_LABEL: Record<Invoice['status'], string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  cancelled: 'Anulada',
}

export function exportInvoiceListPdf(invoices: Invoice[]) {
  const doc = new jsPDF()
  let y = drawBrandHeader(doc, { withContact: false })
  doc.setFontSize(14)
  doc.text('Facturas', 14, y + 6)
  doc.setFontSize(9)
  doc.text(`Generado ${new Date().toLocaleString('es-ES')}`, 14, y + 12)

  autoTable(doc, {
    startY: y + 18,
    head: [['No. Factura', 'Paciente', 'Estado', 'Fecha', 'Subtotal', 'Descuento', 'ITBIS', 'Total']],
    body: invoices.map((inv) => [
      inv.invoice_number ?? '—',
      inv.patient?.full_name ?? '—',
      STATUS_LABEL[inv.status],
      inv.issue_date ?? '—',
      inv.subtotal.toFixed(2),
      inv.discount_amount.toFixed(2),
      inv.tax_amount.toFixed(2),
      inv.total.toFixed(2),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [46, 200, 192] },
  })

  doc.save(`facturas_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportInvoicePdf(invoice: Invoice, items: InvoiceItem[], payments: Payment[]) {
  const doc = new jsPDF()
  let y = drawBrandHeader(doc)
  y += 8

  doc.setFontSize(11)
  doc.text(invoice.invoice_number ? `Factura: ${invoice.invoice_number}` : 'Borrador (sin emitir)', 14, y)
  doc.text(`Estado: ${STATUS_LABEL[invoice.status]}`, 14, y + 6)
  doc.text(`Fecha de emisión: ${invoice.issue_date ?? '—'}`, 14, y + 12)
  doc.text(`Paciente: ${invoice.patient?.full_name ?? '—'}`, 14, y + 18)

  autoTable(doc, {
    startY: y + 26,
    head: [['Descripción', 'Cant.', 'Precio', 'Monto']],
    body: items.map((item) => [item.description, String(item.quantity), item.unit_price.toFixed(2), item.amount.toFixed(2)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 200, 192] },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFontSize(10)
  doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, 140, y)
  y += 6
  doc.text(`Descuento: -${invoice.discount_amount.toFixed(2)}`, 140, y)
  y += 6
  doc.text(`ITBIS (${invoice.tax_rate}%): ${invoice.tax_amount.toFixed(2)}`, 140, y)
  y += 6
  doc.setFontSize(12)
  doc.text(`Total: ${invoice.total.toFixed(2)}`, 140, y)

  if (payments.length > 0) {
    y += 12
    doc.setFontSize(10)
    doc.text('Pagos registrados:', 14, y)
    autoTable(doc, {
      startY: y + 4,
      head: [['Fecha', 'Método', 'Referencia', 'Monto']],
      body: payments.map((p) => [
        new Date(p.paid_at).toLocaleDateString('es-ES'),
        p.method,
        p.reference ?? '—',
        p.amount.toFixed(2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 200, 192] },
    })
  }

  if (invoice.notes) {
    const notesY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    doc.setFontSize(9)
    doc.text(`Notas: ${invoice.notes}`, 14, notesY)
  }

  doc.save(`${invoice.invoice_number ?? 'factura-borrador'}.pdf`)
}
