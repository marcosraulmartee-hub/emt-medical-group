import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PaymentWithInvoice } from '../services/payments'
import type { CashClosing } from '../services/cashClosings'

export function exportCashClosingPdf(
  dateISO: string,
  totals: {
    total_efectivo: number
    total_tarjeta: number
    total_transferencia: number
    total_otro: number
    total_collected: number
    invoices_issued_count: number
    invoices_issued_total: number
    counted_cash: number | null
  },
  payments: PaymentWithInvoice[],
) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('EMT Medical Group', 14, 18)
  doc.setFontSize(10)
  doc.text('Caja diaria — cierre', 14, 24)
  doc.setFontSize(11)
  doc.text(`Fecha: ${dateISO}`, 14, 34)

  autoTable(doc, {
    startY: 42,
    head: [['Concepto', 'Monto (RD$)']],
    body: [
      ['Efectivo', totals.total_efectivo.toFixed(2)],
      ['Tarjeta', totals.total_tarjeta.toFixed(2)],
      ['Transferencia', totals.total_transferencia.toFixed(2)],
      ['Otro', totals.total_otro.toFixed(2)],
      ['Total cobrado', totals.total_collected.toFixed(2)],
      ['Facturas emitidas', String(totals.invoices_issued_count)],
      ['Total facturado', totals.invoices_issued_total.toFixed(2)],
      ...(totals.counted_cash !== null
        ? [
            ['Efectivo contado físicamente', totals.counted_cash.toFixed(2)],
            ['Diferencia (contado - sistema)', (totals.counted_cash - totals.total_efectivo).toFixed(2)],
          ]
        : []),
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 200, 192] },
  })

  if (payments.length > 0) {
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text('Pagos del día', 14, y)
    autoTable(doc, {
      startY: y + 4,
      head: [['Hora', 'No. Factura', 'Paciente', 'Método', 'Referencia', 'Monto']],
      body: payments.map((p) => [
        new Date(p.paid_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        p.invoice?.invoice_number ?? '—',
        p.invoice?.patient?.full_name ?? '—',
        p.method,
        p.reference ?? '—',
        p.amount.toFixed(2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 200, 192] },
    })
  }

  doc.save(`caja_${dateISO}.pdf`)
}

export function exportCashClosingHistoryPdf(history: CashClosing[]) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('EMT Medical Group', 14, 18)
  doc.setFontSize(10)
  doc.text('Historial de cierres de caja', 14, 24)
  doc.setFontSize(9)
  doc.text(`Generado ${new Date().toLocaleString('es-ES')}`, 14, 30)

  autoTable(doc, {
    startY: 36,
    head: [['Fecha', 'Cobrado', 'Facturado', 'Efectivo contado', 'Diferencia', 'Cerrado por']],
    body: history.map((c) => [
      c.closing_date,
      c.total_collected.toFixed(2),
      c.invoices_issued_total.toFixed(2),
      c.counted_cash !== null ? c.counted_cash.toFixed(2) : '—',
      c.counted_cash !== null ? (c.counted_cash - c.total_efectivo).toFixed(2) : '—',
      c.closer?.full_name ?? '—',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [46, 200, 192] },
  })

  doc.save(`historial_caja_${new Date().toISOString().slice(0, 10)}.pdf`)
}
