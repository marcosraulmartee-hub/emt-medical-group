import jsPDF from 'jspdf'

const MARGIN = 14
const MAX_WIDTH = 182
const PAGE_BOTTOM = 280

function addHeading(doc: jsPDF, text: string, y: number): number {
  if (y > PAGE_BOTTOM - 20) {
    doc.addPage()
    y = 20
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(text, MARGIN, y)
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

export function downloadScaleGuidePdf() {
  const doc = new jsPDF()
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('EMT Medical Group', 105, y, { align: 'center' })
  y += 8
  doc.setFontSize(13)
  doc.text('Guía de aplicación de escalas clínicas', 105, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.text(`Generado ${new Date().toLocaleDateString('es-ES')}`, 105, y, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  y += 14

  y = addHeading(doc, '1. Propósito', y)
  y = addParagraph(
    doc,
    'Las escalas clínicas (PHQ-9, GAD-7, MADRS, Y-BOCS, HAM-D, BDI-II, MoCA, MMSE) se aplican con dos objetivos complementarios:',
    y,
  )
  y = addBullet(doc, 'Seguimiento clínico objetivo de la evolución del paciente durante el tratamiento TMS, para ajustar el protocolo si es necesario.', y)
  y = addBullet(
    doc,
    'Generación de una base de datos longitudinal de la clínica, que respalda futuras investigaciones y publicaciones científicas sobre la efectividad de los protocolos aplicados.',
    y,
  )
  y = addParagraph(
    doc,
    'Que el dato sirva para investigación depende directamente de que se aplique siempre de la misma forma. Un puntaje mal tomado no solo afecta al paciente — invalida ese dato para cualquier análisis posterior.',
    y,
  )

  y = addHeading(doc, '2. Quién aplica cada escala', y)
  y = addParagraph(doc, 'No todas las escalas las aplica la misma persona. Antes de aplicar, confirmá el rol correcto:', y)
  y = addBullet(doc, 'Autoaplicadas por el paciente (el técnico solo entrega el formulario y explica las instrucciones): PHQ-9, GAD-7, BDI-II.', y)
  y = addBullet(doc, 'Heteroaplicadas por el médico/clínico mediante entrevista estructurada (el técnico NO las aplica): MADRS, Y-BOCS, HAM-D.', y)
  y = addBullet(doc, 'Requieren clínico certificado en la herramienta específica: MoCA (certificación gratuita en mocatest.org), MMSE (licencia PAR).', y)

  y = addHeading(doc, '3. Cuándo aplicar (dentro de un ciclo de tratamiento)', y)
  y = addBullet(doc, 'Basal: antes de la sesión 1, para tener un punto de partida.', y)
  y = addBullet(doc, 'Punto medio: aproximadamente a mitad del ciclo (ej. sesión 10–15 de 20–36), para evaluar respuesta temprana.', y)
  y = addBullet(doc, 'Final: en la última sesión planificada del ciclo.', y)
  y = addBullet(doc, 'Seguimiento (opcional): 1–3 meses después de finalizado el ciclo, para evaluar sostenimiento de la mejoría.', y)
  y = addParagraph(doc, 'El médico a cargo define qué escalas corresponden a cada paciente según su diagnóstico — no todas se aplican a todos.', y)

  y = addHeading(doc, '4. Procedimiento paso a paso para el técnico', y)
  y = addBullet(doc, 'Confirmá con el médico o en la ficha del paciente qué escala(s) corresponde aplicar ese día.', y)
  y = addBullet(doc, 'Verificá que el paciente tenga consentimiento informado vigente, que incluya el uso de sus datos anonimizados para investigación.', y)
  y = addBullet(doc, 'Ofrecé un ambiente privado y tranquilo, sin apuro.', y)
  y = addBullet(doc, 'Si es autoaplicada: entregá el formulario en blanco (descargable desde Configuración → Escalas clínicas) y las instrucciones; el paciente la completa solo.', y)
  y = addBullet(doc, 'Si es heteroaplicada: derivá al médico responsable — el técnico no la administra.', y)
  y = addBullet(doc, 'Sumá el puntaje total según las instrucciones de la escala.', y)
  y = addBullet(doc, 'Registrá el resultado de inmediato en el sistema: Pacientes → ficha del paciente → pestaña Escalas clínicas → "Registrar escala".', y)
  y = addBullet(doc, 'Asociá el puntaje al ciclo de tratamiento correspondiente cuando el sistema lo solicite.', y)

  y = addHeading(doc, '5. Uso de los datos en investigación', y)
  y = addBullet(doc, 'Los puntajes registrados alimentan una base de datos longitudinal propia de la clínica.', y)
  y = addBullet(
    doc,
    'Para cualquier análisis o publicación, los datos se usan de forma anonimizada/agregada — nunca identificando a un paciente individual sin su consentimiento explícito adicional.',
    y,
  )
  y = addBullet(doc, 'La consistencia en el modo de aplicación (mismo procedimiento, mismas condiciones) es lo que hace que estos datos sean válidos para análisis estadístico futuro.', y)
  y = addBullet(doc, 'Cualquier duda sobre si un dato debe registrarse o cómo interpretarlo: consultá al médico responsable antes de cargarlo.', y)

  y = addHeading(doc, '6. Confidencialidad', y)
  addParagraph(
    doc,
    'Toda la información de escalas es un dato clínico sensible protegido por la Ley 172-13 de República Dominicana. No se comparte fuera del sistema, no se envía por mensajería personal, y el acceso queda restringido a los roles clínicos autorizados dentro de la aplicación.',
    y,
  )

  doc.save('guia-aplicacion-escalas-clinicas-emt.pdf')
}
