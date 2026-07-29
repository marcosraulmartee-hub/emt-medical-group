import jsPDF from 'jspdf'
import { drawBrandHeader } from './brandAssets'

const NAVY: [number, number, number] = [4, 56, 96]
const LEFT_X = 14
const RIGHT_X = 109
const LINE_WIDTH = 87

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...NAVY)
  doc.text(title, LEFT_X, y)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  return y + 6
}

function field(doc: jsPDF, x: number, y: number, label: string) {
  doc.text(`${label}: ${'_'.repeat(38)}`, x, y)
}

export function downloadPatientIntakePdf() {
  const doc = new jsPDF()

  let y = drawBrandHeader(doc)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('FICHA DE REGISTRO DE PACIENTE', 105, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text('Complete a mano para que recepción registre sus datos en el sistema.', 105, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y += 13
  y = sectionTitle(doc, y, 'DATOS PERSONALES')
  field(doc, LEFT_X, y, 'Nombre completo')
  y += 9
  field(doc, LEFT_X, y, 'Cédula')
  field(doc, RIGHT_X, y, 'Fecha de nacimiento (dd/mm/aaaa)')
  y += 9
  field(doc, LEFT_X, y, 'Género')
  y += 12

  y = sectionTitle(doc, y, 'CONTACTO')
  field(doc, LEFT_X, y, 'Correo electrónico')
  field(doc, RIGHT_X, y, 'Teléfono')
  y += 9
  field(doc, LEFT_X, y, 'Dirección')
  y += 9
  field(doc, LEFT_X, y, 'Ciudad')
  y += 12

  y = sectionTitle(doc, y, 'DATOS SOCIODEMOGRÁFICOS')
  field(doc, LEFT_X, y, 'Ocupación')
  field(doc, RIGHT_X, y, 'Nivel educativo')
  y += 9
  field(doc, LEFT_X, y, 'Estado civil')
  y += 12

  y = sectionTitle(doc, y, 'CONTACTO DE EMERGENCIA')
  field(doc, LEFT_X, y, 'Nombre')
  field(doc, RIGHT_X, y, 'Teléfono')
  y += 12

  y = sectionTitle(doc, y, 'REFERENCIA Y COBERTURA')
  field(doc, LEFT_X, y, 'Referido por')
  field(doc, RIGHT_X, y, 'Seguro médico')
  y += 9
  field(doc, LEFT_X, y, 'Historia clínica (si ya tiene una previa)')
  y += 18

  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'Este formulario es solo para recolectar la información — recepción lo transcribe a la ficha digital del paciente en el sistema.',
    LEFT_X,
    y,
  )

  doc.setDrawColor(200, 200, 200)
  doc.rect(LEFT_X, y + 8, 87, 45)
  doc.rect(RIGHT_X, y + 8, LINE_WIDTH, 45)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Notas de recepción', LEFT_X + 3, y + 14)
  doc.text('Firma del paciente / fecha', RIGHT_X + 3, y + 14)

  doc.save('ficha-registro-paciente-emt-medica-group.pdf')
}
