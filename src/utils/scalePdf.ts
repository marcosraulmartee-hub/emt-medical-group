import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PatientScaleScore } from '../services/patientScaleScores'

export function exportScaleHistoryPdf(patientName: string, scores: PatientScaleScore[]) {
  const doc = new jsPDF()

  doc.setFontSize(14)
  doc.text('EMT Medical Group — Historial de escalas clínicas', 14, 16)
  doc.setFontSize(10)
  doc.text(`Paciente: ${patientName}`, 14, 24)
  doc.text(`Generado ${new Date().toLocaleString('es-ES')}`, 14, 30)

  const sorted = [...scores].sort((a, b) => a.administered_at.localeCompare(b.administered_at))

  autoTable(doc, {
    startY: 36,
    head: [['Fecha', 'Escala', 'Puntaje', 'Notas']],
    body: sorted.map((s) => [s.administered_at, s.scale?.label ?? s.scale_code, String(s.score), s.notes ?? '']),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 200, 192] },
  })

  doc.save(`escalas_${patientName.replace(/\s+/g, '_').toLowerCase()}.pdf`)
}
