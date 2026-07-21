import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import { Input } from '../components/ui/Input'
import { PatientCreateModal } from '../components/patients/PatientCreateModal'
import type { Patient } from '../services/patients'
import { listPatients } from '../services/patients'

export function PatientsPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setPatients(await listPatients())
    } catch {
      setError('No se pudieron cargar los pacientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return patients
    return patients.filter(
      (p) => p.full_name.toLowerCase().includes(term) || (p.email ?? '').toLowerCase().includes(term),
    )
  }, [search, patients])

  return (
    <AppShell title="Pacientes">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Lista de pacientes</h2>
            <p className="text-sm text-slate-500">Registra, filtra y revisa historiales clínicos.</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>Nueva ficha</Button>
        </div>

        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />

        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {loading ? (
            <div className="p-6 text-slate-500">Cargando pacientes...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-slate-500">No hay pacientes registrados.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                headers={['Nombre', 'Email', 'Teléfono', 'Fecha de nacimiento', '']}
                rows={filtered.map((patient) => (
                  <tr
                    key={patient.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    <td className="px-4 py-4 text-slate-700">{patient.full_name}</td>
                    <td className="px-4 py-4 text-slate-500">{patient.email || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{patient.phone || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{patient.birth_date || '—'}</td>
                    <td className="px-4 py-4 text-teal-600">Ver ficha</td>
                  </tr>
                ))}
              />
            </div>
          )}
        </div>
      </div>

      <PatientCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false)
          void load()
        }}
      />
    </AppShell>
  )
}
