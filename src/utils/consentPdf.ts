import jsPDF from 'jspdf'
import { drawBrandHeader, ISOTIPO_PNG } from './brandAssets'

const NAVY: [number, number, number] = [4, 56, 96]
const LEFT_X = 14
const RIGHT_X = 109
const COL_WIDTH = 87
const PAGE_BOTTOM = 282

function sectionTitle(doc: jsPDF, x: number, width: number, title: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...NAVY)
  const lines = doc.splitTextToSize(title, width) as string[]
  lines.forEach((line, i) => doc.text(line, x, y + i * 4.5))
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  return y + lines.length * 4.5 + 3
}

function paragraphSection(doc: jsPDF, x: number, width: number, title: string, paragraph: string, startY: number): number {
  let y = sectionTitle(doc, x, width, title, startY)
  const lines = doc.splitTextToSize(paragraph, width) as string[]
  lines.forEach((line, i) => doc.text(line, x, y + i * 4))
  return y + lines.length * 4 + 4
}

export function downloadConsentPdf() {
  const doc = new jsPDF()

  let y = drawBrandHeader(doc)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('CONSENTIMIENTO INFORMADO', 105, y, { align: 'center' })
  y += 7
  doc.setFontSize(11)
  doc.text('PARA ESTIMULACIÓN MAGNÉTICA TRANSCRANEAL (EMT)', 105, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text('Paciente: ______________________________________________', LEFT_X, y)
  doc.text('Fecha: _____ / _____ / _____', RIGHT_X, y)
  y += 7
  doc.text('Documento de identidad: ____________________________', LEFT_X, y)
  doc.text('Médico tratante: ___________________________', RIGHT_X, y)
  y += 7
  doc.text('Fecha de nacimiento: _____ / _____ / _____', LEFT_X, y)
  doc.text('Diagnóstico: ___________________________', RIGHT_X, y)
  y += 9

  let leftY = y
  let rightY = y

  leftY = paragraphSection(
    doc,
    LEFT_X,
    COL_WIDTH,
    '1. INFORMACIÓN SOBRE EL PROCEDIMIENTO',
    'Comprendo que la EMT es un procedimiento médico no invasivo. Comprendo que utiliza pulsos magnéticos aplicados sobre determinadas regiones cerebrales. Comprendo que el procedimiento no requiere anestesia. Comprendo que permaneceré despierto durante las sesiones. He tenido oportunidad de realizar preguntas y recibir respuestas satisfactorias.',
    leftY,
  )

  rightY = paragraphSection(
    doc,
    RIGHT_X,
    COL_WIDTH,
    '2. EXPECTATIVAS DEL TRATAMIENTO',
    'La EMT puede contribuir a la mejoría de mis síntomas. La respuesta al tratamiento puede variar entre pacientes. No se me ha garantizado curación ni resultados específicos, ni remisión total de la enfermedad.',
    rightY,
  )

  y = Math.max(leftY, rightY) + 4
  leftY = y
  rightY = y

  leftY = paragraphSection(
    doc,
    LEFT_X,
    COL_WIDTH,
    '3. ALTERNATIVAS TERAPÉUTICAS EXPLICADAS',
    'Se me han explicado como alternativas terapéuticas el tratamiento farmacológico, la psicoterapia, la continuación del tratamiento actual y otras alternativas médicamente apropiadas según mi condición clínica.',
    leftY,
  )

  rightY = paragraphSection(
    doc,
    RIGHT_X,
    COL_WIDTH,
    '4. POSIBLES EFECTOS ADVERSOS Y RIESGOS',
    'Se me han explicado los posibles efectos adversos y riesgos del tratamiento, entre ellos molestias o dolor leve en el cuero cabelludo, cefalea transitoria, sensación de hormigueo facial, fatiga posterior a la sesión, mareos pasajeros y empeoramiento temporal de síntomas. Comprendo que existe un riesgo extremadamente bajo de convulsión, aun siguiendo los protocolos de seguridad.',
    rightY,
  )

  y = Math.max(leftY, rightY) + 4
  leftY = y
  rightY = y

  leftY = paragraphSection(
    doc,
    LEFT_X,
    COL_WIDTH,
    '5. DECLARACIÓN DE SEGURIDAD',
    'Declaro haber informado al equipo médico, en caso de presentarlas, sobre las siguientes condiciones: marcapasos u otro dispositivo electrónico implantado, implantes metálicos en cabeza o cuello, clips aneurismáticos, implante coclear, antecedentes de epilepsia o convulsiones, embarazo o sospecha de embarazo, cirugía neurológica previa, u otra condición médica relevante.',
    leftY,
  )

  rightY = paragraphSection(
    doc,
    RIGHT_X,
    COL_WIDTH,
    '6. INFORMACIÓN ECONÓMICA',
    'Se me ha explicado el costo del tratamiento y el número estimado de sesiones, y comprendo las condiciones de pago establecidas por EMT Médica Group, S.R.L.',
    rightY,
  )

  y = Math.max(leftY, rightY) + 4
  if (y > PAGE_BOTTOM - 60) {
    doc.addPage()
    y = 20
  }

  y = paragraphSection(
    doc,
    LEFT_X,
    182,
    '7. AUTORIZACIÓN Y VOLUNTARIEDAD',
    'He recibido información suficiente sobre los beneficios, riesgos y alternativas del tratamiento, y he comprendido la información recibida. Mi participación es voluntaria y puedo retirar mi consentimiento y suspender el tratamiento en cualquier momento. Autorizo el registro y almacenamiento de mi información clínica para fines asistenciales y de seguimiento médico, y autorizo voluntariamente la realización del tratamiento mediante Estimulación Magnética Transcraneal (EMT).',
    y,
  )

  y += 3
  y = sectionTitle(doc, LEFT_X, 182, '8. DECLARACIÓN FINAL', y)
  doc.setFont('helvetica', 'italic')
  const finalText = doc.splitTextToSize(
    'Declaro que he leído este documento o me ha sido leído íntegramente, que he comprendido su contenido y que otorgo mi consentimiento libre y voluntario para la realización del procedimiento descrito.',
    182,
  ) as string[]
  finalText.forEach((line, i) => doc.text(line, LEFT_X, y + i * 4.5))
  doc.setFont('helvetica', 'normal')
  y += finalText.length * 4.5 + 10

  if (y > PAGE_BOTTOM - 35) {
    doc.addPage()
    y = 20
  }

  const sigWidth = 44
  const sigGap = 4
  const sigLabels = [
    'FIRMA DEL PACIENTE',
    'FIRMA DEL REPRESENTANTE LEGAL\n(Si aplica)',
    'FIRMA DEL MÉDICO TRATANTE',
    'FIRMA DEL TÉCNICO EMT\n/ TESTIGO INSTITUCIONAL',
  ]
  const sigFields = [
    ['Nombre: ______________', 'Documento de identidad: ____'],
    ['Nombre: ______________', 'Documento de identidad: ____', 'Parentesco: ___________'],
    ['Nombre: ______________', 'Exequátur: ____________'],
    ['Nombre: ______________', 'Certificación: __________'],
  ]

  sigLabels.forEach((label, idx) => {
    const x = LEFT_X + idx * (sigWidth + sigGap)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    const labelLines = label.split('\n').flatMap((part) => doc.splitTextToSize(part, sigWidth) as string[])
    labelLines.forEach((line, i) => doc.text(line, x, y + i * 3.2))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    let fy = y + labelLines.length * 3.2 + 10
    for (const field of sigFields[idx]) {
      const lines = doc.splitTextToSize(field, sigWidth) as string[]
      lines.forEach((line) => {
        doc.text(line, x, fy)
        fy += 3.5
      })
    }
  })

  y += 42
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setFillColor(...NAVY)
  doc.rect(LEFT_X, y, 182, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text('Este consentimiento forma parte integral de la historia clínica del paciente.', 105, y + 5.5, { align: 'center' })
  doc.addImage(ISOTIPO_PNG, 'PNG', 105 - 3, y + 10, 6, 3.05)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('EMT MÉDICA GROUP, S.R.L.', LEFT_X, y + 16)
  doc.text('REV. 05/2025', 196 - 14, y + 16, { align: 'right' })

  doc.save('consentimiento-informado-emt-medica-group.pdf')
}
