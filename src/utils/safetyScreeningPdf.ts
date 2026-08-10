import jsPDF from 'jspdf'
import { drawBrandHeader, ISOTIPO_PNG } from './brandAssets'

const NAVY: [number, number, number] = [4, 56, 96]
const LEFT_X = 14
const BOX_WIDTH = 182
const TEXT_X = 18
const TEXT_WIDTH = 138
const CHECK_X = 158
const PAGE_BOTTOM = 280

interface ScreeningQuestion {
  text: string
  hasBlank?: boolean
}

const QUESTIONS: ScreeningQuestion[] = [
  { text: '¿Ha tenido alguna vez una reacción adversa a la EMT? En caso afirmativo, descríbala.', hasBlank: true },
  { text: '¿Tiene epilepsia o ha sufrido alguna vez un episodio con convulsiones?' },
  { text: '¿Tiene usted, o algún miembro de su familia, antecedentes de epilepsia o convulsiones?' },
  { text: '¿Ha sufrido alguna vez un desmayo o síncope? En caso afirmativo, descríbalo.', hasBlank: true },
  { text: '¿Ha sufrido alguna vez un ictus?' },
  { text: '¿Ha sufrido alguna vez un traumatismo craneal grave (con pérdida de conocimiento)?' },
  { text: '¿Se ha sometido alguna vez a una intervención neuroquirúrgica de cualquier tipo (incluido cerebro o médula espinal)?' },
  {
    text:
      '¿Tiene algún dispositivo implantado como marcapasos cardíaco, desfibrilador implantado (DCI), desfibrilador portátil (DTC), estimuladores del nervio vago (VNS), clips de aneurisma, implantes cocleares, bomba de infusión, estimuladores cerebrales profundos (DBS), derivación CSF, vías intracardíacas, implantes dentales activados magnéticamente o implantes oculares ferromagnéticos?',
  },
  {
    text:
      '¿Tiene algún metal en el cuerpo, como metralla, perdigones, balas, clips quirúrgicos, tatuajes faciales con tinta metálica o fragmentos de soldadura o metalurgia?',
  },
  {
    text:
      '¿Tiene algún dispositivo portátil o implantado de administración automática de fármacos (por ejemplo, bomba de insulina), endoprótesis, filtros venosos, válvulas cardíacas artificiales, sistemas programables de derivación valvular, dispositivos de fijación de la columna cervical, suturas hechas con grapas u otros materiales metálicos, microchips implantados o implantes radiactivos?',
  },
  { text: '¿Sufre dolores de cabeza frecuentes o fuertes?' },
  { text: '¿Le han diagnosticado alguna otra enfermedad neurológica o psiquiátrica?' },
  { text: '¿Ha sufrido alguna enfermedad que le haya causado daño cerebral?' },
  { text: '¿Tiene problemas de audición o algún síntoma de pitidos en los oídos?' },
  {
    text:
      '¿Está tomando algún medicamento psicoactivo, como medicación para la depresión, la ansiedad, antipsicóticos, estabilizadores del estado de ánimo, anticonvulsivos o cualquier otra medicación que afecte su sistema nervioso? Enumérelos.',
    hasBlank: true,
  },
  {
    text:
      '¿Está tomando algún otro medicamento o sustancia? Enumérelos. Si alguna de estas sustancias es ilegal, marque "sí" pero no escriba el nombre de la sustancia. Nos pondremos en contacto con usted confidencialmente para discutir en persona si la EMT será segura para usted.',
    hasBlank: true,
  },
  { text: '¿Está embarazada o tiene motivos para creer que puede estarlo?' },
  { text: '¿Ha consumido alcohol en las últimas 24 horas?' },
  { text: '¿Ha dormido lo suficiente esta noche?' },
  { text: '¿Ha participado en algún estudio de EMT en las últimas 24 horas?' },
]

function measureRowHeight(doc: jsPDF, num: number, q: ScreeningQuestion): number {
  const lines = doc.splitTextToSize(`(${num}) ${q.text}`, TEXT_WIDTH) as string[]
  let h = 5 + lines.length * 4
  if (q.hasBlank) h += 6
  return Math.max(h + 3, 12)
}

function drawQuestionRow(doc: jsPDF, num: number, q: ScreeningQuestion, y: number): number {
  const rowHeight = measureRowHeight(doc, num, q)

  doc.setDrawColor(210)
  doc.rect(LEFT_X, y, BOX_WIDTH, rowHeight)
  doc.setDrawColor(0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const lines = doc.splitTextToSize(`(${num}) ${q.text}`, TEXT_WIDTH) as string[]
  let textY = y + 5
  lines.forEach((line, i) => doc.text(line, TEXT_X, textY + i * 4))
  let bottom = textY + lines.length * 4

  if (q.hasBlank) {
    bottom += 2
    doc.setDrawColor(160)
    doc.line(TEXT_X, bottom, TEXT_X + TEXT_WIDTH, bottom)
    doc.setDrawColor(0)
  }

  const cbY = y + rowHeight / 2 - 1.4
  doc.setFontSize(8)
  doc.rect(CHECK_X, cbY, 2.8, 2.8)
  doc.text('Sí', CHECK_X + 4, cbY + 2.3)
  doc.rect(CHECK_X + 13, cbY, 2.8, 2.8)
  doc.text('No', CHECK_X + 17, cbY + 2.3)

  return y + rowHeight
}

function fieldLine(doc: jsPDF, label: string, x: number, y: number, blankWidth: number): void {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text(label, x, y)
  const labelWidth = doc.getTextWidth(label + ' ')
  doc.setDrawColor(120)
  doc.line(x + labelWidth, y + 0.8, x + labelWidth + blankWidth, y + 0.8)
  doc.setDrawColor(0)
}

function checkboxOption(doc: jsPDF, x: number, y: number, label: string): number {
  doc.rect(x, y - 2.8, 2.8, 2.8)
  doc.setFontSize(9.5)
  doc.text(label, x + 4, y)
  return x + 4 + doc.getTextWidth(label) + 6
}

export function downloadSafetyScreeningPdf() {
  const doc = new jsPDF()
  let y = drawBrandHeader(doc)
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13.5)
  doc.setTextColor(...NAVY)
  const titleLines = doc.splitTextToSize(
    'Cuestionario de cribado de seguridad para Estimulación Magnética Transcraneal (EMT)',
    BOX_WIDTH,
  ) as string[]
  titleLines.forEach((line, i) => doc.text(line, 105, y + i * 5.5, { align: 'center' }))
  doc.setTextColor(0, 0, 0)
  y += titleLines.length * 5.5 + 8

  fieldLine(doc, 'Participante Nombre/ID:', LEFT_X, y, 110)
  y += 8
  fieldLine(doc, 'Edad actual:', LEFT_X, y, 20)
  doc.setFontSize(9.5)
  doc.text('(años)', LEFT_X + 62, y)
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text('Lateralidad:', LEFT_X, y)
  let cx = LEFT_X + 22
  cx = checkboxOption(doc, cx, y, 'Zurdo')
  cx = checkboxOption(doc, cx, y, 'Diestro')
  checkboxOption(doc, cx, y, 'Ambidiestro')
  y += 9

  doc.text('Sexo:', LEFT_X, y)
  cx = LEFT_X + 14
  cx = checkboxOption(doc, cx, y, 'M')
  cx = checkboxOption(doc, cx, y, 'F')
  checkboxOption(doc, cx, y, 'Otro')
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('TODA LA INFORMACIÓN SERÁ TRATADA CONFIDENCIALMENTE', LEFT_X, y)
  doc.setFont('helvetica', 'normal')
  y += 6

  QUESTIONS.forEach((q, i) => {
    const num = i + 1
    const rowHeight = measureRowHeight(doc, num, q)
    if (y + rowHeight > PAGE_BOTTOM) {
      doc.addPage()
      y = 18
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text('Cuestionario de cribado de seguridad para EMT (continuación)', LEFT_X, y)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      y += 6
    }
    y = drawQuestionRow(doc, num, q, y)
  })

  if (y + 24 > PAGE_BOTTOM) {
    doc.addPage()
    y = 18
  } else {
    y += 10
  }

  fieldLine(doc, 'Firmado', LEFT_X, y, 55)
  doc.setFontSize(9.5)
  doc.text('/', LEFT_X + 68, y)
  fieldLine(doc, '', LEFT_X + 72, y, 45)
  fieldLine(doc, 'Fecha', LEFT_X + 128, y, 40)

  y += 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setFillColor(...NAVY)
  doc.rect(LEFT_X, y, BOX_WIDTH, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text('Este cuestionario forma parte integral de la historia clínica del paciente.', 105, y + 5.5, { align: 'center' })
  doc.addImage(ISOTIPO_PNG, 'PNG', 105 - 3, y + 10, 6, 3.05)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('EMT MÉDICA GROUP, S.R.L.', LEFT_X, y + 16)
  doc.text('REV. 05/2025', 196 - 14, y + 16, { align: 'right' })

  doc.save('cuestionario-cribado-seguridad-emt.pdf')
}
