import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Budget, BudgetItem } from '../services/budgets'
import { drawBrandHeader } from './brandAssets'

export function exportBudgetPdf(budget: Budget, items: BudgetItem[]) {
  const doc = new jsPDF()
  let y = drawBrandHeader(doc)
  y += 6

  doc.setFontSize(13)
  doc.text('Presupuesto de tratamiento', 14, y)
  y += 8
  doc.setFontSize(10)
  doc.text(`Paciente: ${budget.patient?.full_name ?? '—'}`, 14, y)
  y += 6
  if (budget.protocol?.name) {
    doc.text(`Protocolo: ${budget.protocol.name}`, 14, y)
    y += 6
  }
  doc.text(`Fecha: ${new Date(budget.created_at).toLocaleDateString('es-ES')}`, 14, y)
  y += 6
  if (budget.valid_until) {
    doc.text(`Válido hasta: ${budget.valid_until}`, 14, y)
    y += 6
  }

  autoTable(doc, {
    startY: y + 6,
    head: [['Descripción', 'Cant.', 'Precio unitario (RD$)', 'Monto (RD$)']],
    body: items.map((item) => [item.description, String(item.quantity), item.unit_price.toFixed(2), item.amount.toFixed(2)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 200, 192] },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFontSize(10)
  doc.text(`Subtotal: RD$ ${budget.subtotal.toFixed(2)}`, 140, y)
  y += 6
  doc.text(`Descuento: -RD$ ${budget.discount_amount.toFixed(2)}`, 140, y)
  y += 6
  doc.setFontSize(12)
  doc.text(`Total estimado: RD$ ${budget.total.toFixed(2)}`, 140, y)

  if (budget.notes) {
    y += 14
    doc.setFontSize(9)
    doc.text(`Notas: ${budget.notes}`, 14, y)
  }

  y += 16
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(
    'Este documento es un presupuesto informativo y no constituye una factura formal. El monto',
    14,
    y,
  )
  doc.text('final se formaliza mediante factura al momento de iniciar o facturar el tratamiento.', 14, y + 4)

  doc.save(`presupuesto_${(budget.patient?.full_name ?? 'paciente').replace(/\s+/g, '_')}.pdf`)
}
