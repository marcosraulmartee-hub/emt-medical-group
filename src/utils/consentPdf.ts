import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const NAVY: [number, number, number] = [4, 56, 96]
const LEFT_X = 14
const RIGHT_EDGE = 196

interface Question {
  text: string
  blankLine?: boolean
}

const QUESTIONS: Question[] = [
  { text: '¿Ha tenido alguna vez una reacción adversa a la EMT? En caso afirmativo, descríbala.', blankLine: true },
  { text: '¿Tiene epilepsia o ha sufrido alguna vez un episodio con convulsiones?' },
  { text: '¿Tiene usted, o algún miembro de su familia, antecedentes de epilepsia o convulsiones?' },
  { text: '¿Ha sufrido alguna vez un desmayo o síncope? En caso afirmativo, descríbalo.', blankLine: true },
  { text: '¿Ha sufrido alguna vez un ictus?' },
  { text: '¿Ha sufrido alguna vez un traumatismo craneal grave (con pérdida de conocimiento)?' },
  { text: '¿Se ha sometido alguna vez a una intervención neuroquirúrgica de cualquier tipo (incluido cerebro o médula espinal)?' },
  {
    text: '¿Tiene algún dispositivo implantado como marcapasos cardíaco, desfibrilador implantado (DCI), desfibrilador portátil (DTC), estimuladores del nervio vago (VNS), clips de aneurisma, implantes cocleares, bomba de infusión, estimuladores cerebrales profundos (DBS), derivación CSF, vías intracardíacas, implantes dentales activados magnéticamente o implantes oculares ferromagnéticos?',
  },
  {
    text: '¿Tiene algún metal en el cuerpo, como metralla, perdigones, balas, clips quirúrgicos, tatuajes faciales con tinta metálica o fragmentos de soldadura o metalurgia?',
  },
  {
    text: '¿Tiene algún dispositivo portátil o implantado de administración automática de fármacos (por ejemplo, bomba de insulina), endoprótesis, filtros venosos, válvulas cardíacas artificiales, sistemas programables de derivación valvular, dispositivos de fijación de la columna cervical, suturas hechas con grapas u otros materiales metálicos, microchips implantados o implantes radiactivos?',
  },
  { text: '¿Sufre dolores de cabeza frecuentes o fuertes?' },
  { text: '¿Le han diagnosticado alguna otra enfermedad neurológica o psiquiátrica?' },
  { text: '¿Ha sufrido alguna enfermedad que le haya causado daño cerebral?' },
  { text: '¿Tiene problemas de audición o algún síntoma de pitidos en los oídos?' },
  {
    text: '¿Está tomando algún medicamento psicoactivo? ¿Como medicación para la depresión, la ansiedad, antipsicóticos, estabilizadores del estado de ánimo, anticonvulsivos o cualquier otra medicación que afecte a su sistema nervioso? Enumérelos.',
    blankLine: true,
  },
  {
    text: '¿Está tomando algún otro medicamento o sustancia? Enumérelos. Si alguna de estas sustancias es ilegal, marque "sí" pero no escriba el nombre de la sustancia. Nos pondremos en contacto con usted confidencialmente para discutir en persona si la EMT será segura para usted.',
    blankLine: true,
  },
  { text: '¿Está embarazada o tiene motivos para creer que puede estarlo?' },
  { text: '¿Ha consumido alcohol en las últimas 24 horas?' },
  { text: '¿Ha dormido lo suficiente esta noche?' },
  { text: '¿Ha participado en algún estudio de EMT en las últimas 24 horas?' },
]

function drawHeader(doc: jsPDF) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...NAVY)
  doc.text('EMT MÉDICA GROUP', 105, 20, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text('Calle 10 esquina José A. Patiño, No. 2A, Villa Olga,', 105, 27, { align: 'center' })
  doc.text('Santiago de los Caballeros, República Dominicana.', 105, 32, { align: 'center' })
  doc.text('Tel: (809) 330-1538   |   WhatsApp: (809) 570-8705', 105, 37, { align: 'center' })
  doc.text('www.emtmedicalgroup.do   |   emtmedicalgroup@gmail.com', 105, 42, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

function checkbox(doc: jsPDF, x: number, y: number, label: string) {
  doc.rect(x, y - 2.8, 2.8, 2.8)
  doc.text(label, x + 4.5, y)
}

export function downloadConsentPdf() {
  const doc = new jsPDF()

  drawHeader(doc)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('CUESTIONARIO DE CRIBADO DE SEGURIDAD', 105, 53, { align: 'center' })
  doc.text('PARA ESTIMULACIÓN MAGNÉTICA TRANSCRANEAL (EMT)', 105, 59, { align: 'center' })

  let y = 70
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text('Participante Nombre/ID: ________________________________________________', LEFT_X, y)
  y += 7
  doc.text('Edad actual: __________ (años)', LEFT_X, y)
  y += 7
  doc.text('Lateralidad:', LEFT_X, y)
  checkbox(doc, LEFT_X + 20, y, 'Zurdo')
  checkbox(doc, LEFT_X + 45, y, 'Diestro')
  checkbox(doc, LEFT_X + 72, y, 'Ambidiestro')
  y += 7
  doc.text('Sexo:', LEFT_X, y)
  checkbox(doc, LEFT_X + 12, y, 'M')
  checkbox(doc, LEFT_X + 25, y, 'F')
  checkbox(doc, LEFT_X + 38, y, 'Otro')
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('TODA LA INFORMACIÓN SERÁ TRATADA CONFIDENCIALMENTE', LEFT_X, y)
  doc.setFont('helvetica', 'normal')
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: LEFT_X, right: 14 },
    head: [['#', 'Pregunta', 'Sí', 'No']],
    body: QUESTIONS.map((q, i) => [
      String(i + 1),
      q.blankLine ? `${q.text}\n\n_______________________________________________` : q.text,
      '',
      '',
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'middle', lineColor: [180, 180, 180] },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 151 },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && (data.column.index === 2 || data.column.index === 3)) {
        const size = 3
        const cx = data.cell.x + data.cell.width / 2 - size / 2
        const cy = data.cell.y + data.cell.height / 2 - size / 2
        doc.setDrawColor(90, 90, 90)
        doc.rect(cx, cy, size, size)
      }
    },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  let sigY = finalY + 16
  if (sigY > 270) {
    doc.addPage()
    sigY = 30
  }
  doc.setFontSize(9.5)
  doc.text('Firmado _________________________ / _________________________', LEFT_X, sigY)
  doc.text('Fecha ____________________', RIGHT_EDGE - 55, sigY)

  doc.setFontSize(7.5)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'Este cuestionario forma parte de la evaluación de seguridad previa al tratamiento con EMT y de la historia clínica del paciente.',
    LEFT_X,
    sigY + 10,
  )

  doc.save('cuestionario-cribado-seguridad-emt-medica-group.pdf')
}
