import { useEffect, useState } from 'react'
import { ClipboardList, Trash2 } from 'lucide-react'
import type { StaffReminder } from '../../services/staffReminders'
import { addStaffReminder, deleteStaffReminder, listStaffReminders, toggleStaffReminder } from '../../services/staffReminders'

export function RemindersCard() {
  const [reminders, setReminders] = useState<StaffReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      setReminders(await listStaffReminders())
    } catch {
      setError('No se pudieron cargar los pendientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleAdd() {
    if (!text.trim()) return
    setSaving(true)
    setError('')
    try {
      const created = await addStaffReminder(text.trim())
      setReminders((prev) => [created, ...prev])
      setText('')
    } catch {
      setError('No se pudo agregar el pendiente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(reminder: StaffReminder) {
    setReminders((prev) => prev.map((r) => (r.id === reminder.id ? { ...r, is_done: !r.is_done } : r)))
    try {
      await toggleStaffReminder(reminder.id, !reminder.is_done)
    } catch {
      setError('No se pudo actualizar el pendiente.')
      void load()
    }
  }

  async function handleDelete(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id))
    try {
      await deleteStaffReminder(id)
    } catch {
      setError('No se pudo borrar el pendiente.')
      void load()
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <ClipboardList size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-midnight-950">Pendientes de recepción</h3>
          <p className="text-xs text-slate-400">Notas rápidas del día, editables aquí mismo.</p>
        </div>
      </div>

      {error && <p className="mb-2 text-xs text-[#DC4B3E]">{error}</p>}

      <div className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Agregar un pendiente..."
          className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-teal-500"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !text.trim()}
          className="rounded-xl bg-teal-500 px-3 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-40"
        >
          Agregar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : reminders.length === 0 ? (
        <p className="text-sm text-slate-400">Sin pendientes — todo al día.</p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
              <input type="checkbox" checked={r.is_done} onChange={() => handleToggle(r)} className="h-4 w-4 rounded border-slate-300 text-teal-500" />
              <span className={`flex-1 text-sm ${r.is_done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{r.text}</span>
              <button onClick={() => handleDelete(r.id)} className="text-slate-300 hover:text-[#DC4B3E]">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
