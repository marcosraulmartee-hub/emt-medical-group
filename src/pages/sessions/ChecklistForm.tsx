import type { SafetyChecklistItem, ChecklistAnswer } from '../../services/safetyChecklist'

interface ChecklistFormProps {
  items: SafetyChecklistItem[]
  answers: Record<string, ChecklistAnswer>
  onChange: (code: string, answer: ChecklistAnswer) => void
}

export function ChecklistForm({ items, answers, onChange }: ChecklistFormProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-midnight-950">Checklist de seguridad obligatorio</p>
      {items.map((item) => {
        const answer = answers[item.code]
        return (
          <div key={item.code} className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm text-slate-700">{item.label}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onChange(item.code, { code: item.code, label: item.label, passed: true, notes: answer?.notes ?? '' })}
                className={
                  'rounded-xl px-3 py-1.5 text-xs font-medium transition ' +
                  (answer?.passed === true ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 border border-slate-200')
                }
              >
                Cumple
              </button>
              <button
                type="button"
                onClick={() => onChange(item.code, { code: item.code, label: item.label, passed: false, notes: answer?.notes ?? '' })}
                className={
                  'rounded-xl px-3 py-1.5 text-xs font-medium transition ' +
                  (answer?.passed === false ? 'bg-[#DC4B3E] text-white' : 'bg-white text-slate-600 border border-slate-200')
                }
              >
                No cumple
              </button>
            </div>
            {answer?.passed === false && (
              <input
                placeholder="Detalle / acción tomada"
                value={answer.notes}
                onChange={(e) => onChange(item.code, { ...answer, notes: e.target.value })}
                className="mt-2 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
