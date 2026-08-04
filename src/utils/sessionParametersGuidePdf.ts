import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { drawBrandHeader } from './brandAssets'

const MARGIN = 14
const MAX_WIDTH = 182
const PAGE_BOTTOM = 280
const NAVY: [number, number, number] = [4, 56, 96]

function addHeading(doc: jsPDF, text: string, y: number): number {
  if (y > PAGE_BOTTOM - 20) {
    doc.addPage()
    y = 20
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...NAVY)
  doc.text(text, MARGIN, y)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  return y + 8
}

function addParagraph(doc: jsPDF, text: string, y: number): number {
  const lines = doc.splitTextToSize(text, MAX_WIDTH) as string[]
  for (const line of lines) {
    if (y > PAGE_BOTTOM) {
      doc.addPage()
      y = 20
    }
    doc.text(line, MARGIN, y)
    y += 5.5
  }
  return y + 3
}

function addBullet(doc: jsPDF, text: string, y: number): number {
  const lines = doc.splitTextToSize(`•  ${text}`, MAX_WIDTH - 4) as string[]
  lines.forEach((line, i) => {
    if (y > PAGE_BOTTOM) {
      doc.addPage()
      y = 20
    }
    doc.text(line, MARGIN + (i === 0 ? 0 : 4), y)
    y += 5.5
  })
  return y + 1
}

export function downloadSessionParametersGuidePdf() {
  const doc = new jsPDF()
  let y = drawBrandHeader(doc)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('Guía de parámetros de sesión EMT', 105, y, { align: 'center' })
  y += 7
  doc.setFontSize(10.5)
  doc.text('Cómo leer la pantalla del Neuro-MS.NET y llenar el formulario "Registrar sesión"', 105, y, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y += 10

  y = addParagraph(
    doc,
    'Algunos campos del formulario de sesión (umbral motor, pulsos, trenes) usan nombres parecidos a los de la pantalla del equipo pero no son idénticos. Esta guía muestra exactamente qué número va en cada campo, usando como ejemplo una sesión real registrada en el equipo.',
    y,
  )

  y = addHeading(doc, '1. Frecuencia (Hz)', y)
  y = addParagraph(
    doc,
    'La frecuencia de estimulación, en pulsos por segundo. En la pantalla del equipo aparece como el número justo antes de "Hz" (ej. "30 x 10,0 Hz": la frecuencia es 10 Hz). El Neuro-MSX SLIM de la clínica opera hasta 100 Hz.',
    y,
  )

  y = addHeading(doc, '2. Intensidad (%)', y)
  y = addParagraph(
    doc,
    'La intensidad de estimulación, expresada como porcentaje del umbral motor en reposo del paciente (no un valor absoluto). En la pantalla del equipo aparece como "100% MT" (MT = Motor Threshold). Si el equipo muestra "100% MT", el campo "Intensidad (%)" en la app va con 100.',
    y,
  )

  y = addHeading(doc, '3. Umbral motor en reposo — RMT (% MSO)', y)
  y = addParagraph(
    doc,
    'Es el valor de referencia del paciente: el % de la salida máxima del estimulador (MSO) necesario para provocar una respuesta motora en reposo. Se mide UNA vez por paciente (o se reconfirma periódicamente) en la pestaña "UM" del equipo, antes de iniciar la estimulación repetitiva — no es lo mismo que la intensidad de la sesión (punto 2).',
    y,
  )
  y = addParagraph(
    doc,
    'Antes había dos campos separados en la app para este mismo valor ("Umbral motor (%)" y "Motor threshold"), lo cual generaba confusión. Ahora es un solo campo.',
    y,
  )

  y = addHeading(doc, '4. Pulsos por tren, número de trenes y total de pulsos', y)
  y = addParagraph(
    doc,
    'La pantalla del equipo muestra tres números relacionados que se confunden fácilmente. Con el ejemplo "30 x 10,0 Hz ... x100 ... 3000 pulsos":',
    y,
  )
  y = addBullet(doc, '"Pulsos por tren" = 30 (el primer número antes de la "x" junto a los Hz).', y)
  y = addBullet(doc, '"Número de trenes" = 100 (el número junto a la segunda "x", más a la derecha del dibujo del tren).', y)
  y = addBullet(doc, '"Total de pulsos" = 3000 (30 × 100) — la app lo calcula sola, solo sirve para verificar contra el número que muestra el equipo.', y)

  y = addHeading(doc, '5. Ejemplo completo (sesión real)', y)
  y = addParagraph(doc, 'Paciente: 33 años · Protocolo: Alcohol craving, Variant 2 · Sesión 1 de 20 · Área: dmPFC/ACC', y)

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: 14 },
    head: [['Campo en la app', 'Valor', 'De dónde sale en la pantalla del equipo']],
    body: [
      ['Frecuencia (Hz)', '10', '"30 x 10,0 Hz"'],
      ['Intensidad (%)', '100', '"100% MT"'],
      ['Umbral motor en reposo — RMT', '(según pestaña UM)', 'Pestaña "UM", no visible en esta pantalla'],
      ['Pulsos por tren', '30', '"30 x 10,0 Hz"'],
      ['Número de trenes', '100', '"x100"'],
      ['Total de pulsos', '3000 (automático)', '"3000 pulsos"'],
      ['Región estimulada', 'dmPFC/ACC', '"Área de estimulación"'],
    ],
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  let y2 = finalY + 8

  y2 = addHeading(doc, '6. Si algo no coincide', y2)
  addBullet(
    doc,
    'Si no estás seguro de un valor, registrá la sesión con los campos que sí tenés claros y avisá al médico responsable antes de repetir el protocolo — no adivines un número clínico.',
    y2,
  )

  doc.save('guia-parametros-sesion-emt.pdf')
}
