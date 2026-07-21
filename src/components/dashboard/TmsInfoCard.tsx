import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQ: { question: string; answer: string }[] = [
  {
    question: '¿Qué es la Estimulación Magnética Transcraneal (TMS)?',
    answer:
      'Un tratamiento no invasivo que usa pulsos magnéticos para estimular zonas específicas del cerebro (como la corteza prefrontal dorsolateral). No requiere anestesia ni ingreso hospitalario: el paciente llega, se sienta, recibe la sesión de unos 20 minutos y se retira por su cuenta.',
  },
  {
    question: '¿Para qué condiciones se usa?',
    answer:
      'Depresión mayor (incluida la resistente a medicación), trastorno obsesivo-compulsivo (TOC) y depresión con ansiedad son las indicaciones más establecidas. También se investiga y usa en cesación tabáquica y migraña con aura.',
  },
  {
    question: '¿Qué tan efectivo es?',
    answer:
      'En estudios de vida real, alrededor de 8 de cada 10 pacientes con depresión muestran respuesta clínica (≥50% de mejoría) y 6 de cada 10 alcanzan remisión. En TOC, cerca del 60% responde y el 40% remite.',
  },
  {
    question: '¿Cuántas sesiones necesita un ciclo típico?',
    answer:
      'Entre 20 y 36 sesiones, generalmente de lunes a viernes durante 4 a 6 semanas. Cada sesión dura aproximadamente 20-30 minutos según el protocolo.',
  },
  {
    question: '¿Es segura? ¿Tiene efectos secundarios?',
    answer:
      'Sí — a diferencia de la medicación no tiene efectos secundarios sistémicos. Lo más común es molestia leve en el cuero cabelludo o cefalea transitoria durante/después de la sesión. El riesgo de convulsión existe pero es muy bajo, por eso se aplica un checklist de seguridad antes de cada sesión.',
  },
  {
    question: '¿El paciente puede volver a sus actividades normales después?',
    answer:
      'Sí, de inmediato — no hay sedación ni tiempo de recuperación. El paciente puede manejar, trabajar o continuar su día con normalidad al salir de la sesión.',
  },
]

export function TmsInfoCard() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <HelpCircle size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-midnight-950">Sobre el TMS</h3>
          <p className="text-xs text-slate-400">Preguntas frecuentes sobre la utilidad del tratamiento</p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {FAQ.map((item, i) => {
          const open = openIndex === i
          return (
            <li key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium text-midnight-950"
              >
                {item.question}
                <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && <p className="pb-3 text-sm text-slate-500">{item.answer}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
