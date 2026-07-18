import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import type { Patient } from '../services/patients'
import { listPatients } from '../services/patients'

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPatients() {
      try {
        const data = await listPatients()
        setPatients(data)
      } catch {
        setError('No se pudieron cargar los pacientes.')
      } finally {
        setLoading(false)
      }
    }

    void loadPatients()
  }, [])

  return (
    <AppShell title="Pacientes">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Lista de pacientes</h2>
            <p className="text-sm text-slate-500">Registra, filtra y revisa historiales clínicos.</p>
          </div>
          <Button>Nueva ficha</Button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {loading ? (
            <div className="p-6 text-slate-500">Cargando pacientes...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : patients.length === 0 ? (
            <div className="p-6 text-slate-500">No hay pacientes registrados.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                headers={["Nombre", "Email", "Teléfono", "Fecha de nacimiento", "Acción"]}
                rows={patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{patient.full_name}</td>
                    <td className="px-4 py-4 text-slate-500">{patient.email || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{patient.phone || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{patient.birth_date || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">Ver</td>
                  </tr>
                ))}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
