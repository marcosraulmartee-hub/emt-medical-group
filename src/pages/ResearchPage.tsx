import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Table } from '../components/ui/Table'
import { buildResearchDataset } from '../services/researchExport'
import { toISODate } from '../utils/dates'

function unionHeaders(rows: Record<string, string | number>[]): string[] {
  const headers: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key)
    }
  }
  return headers
}

export function ResearchPage() {
  const [rows, setRows] = useState<Record<string, string | number>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setRows(await buildResearchDataset({ anonymize: false }))
    } catch {
      setError('No se pudo cargar la información de investigación.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      const anonRows = await buildResearchDataset({ anonymize: true })
      if (anonRows.length === 0) {
        setError('Ningún paciente tiene consentimiento de investigación activo todavía.')
        return
      }
      const worksheet = XLSX.utils.json_to_sheet(anonRows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Investigación')
      XLSX.writeFile(workbook, `dataset_investigacion_${toISODate(new Date())}.xlsx`)
    } catch {
      setError('No se pudo generar el dataset de investigación.')
    } finally {
      setExporting(false)
    }
  }

  const headers = unionHeaders(rows)

  return (
    <AppShell title="Investigación">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Investigación clínica</h2>
            <p className="text-sm text-slate-500">
              Pacientes con consentimiento de investigación: historia de tratamientos, escalas (basal vs. último puntaje,
              respuesta y remisión) y desenlaces. El consentimiento se marca en la pestaña "Investigación clínica" de la
              ficha de cada paciente.
            </p>
          </div>
          <Button onClick={handleExport} loading={exporting} disabled={rows.length === 0 && !loading}>
            Exportar Excel (anonimizado)
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-xs uppercase tracking-wide text-slate-400">Pacientes con consentimiento</p>
          <p className="mt-1 text-2xl font-semibold text-midnight-950">{loading ? '—' : rows.length}</p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : rows.length === 0 ? (
          <Alert variant="info">
            Todavía ningún paciente tiene el consentimiento de investigación activo. Ve a la ficha del paciente → pestaña
            "Investigación clínica" para marcarlo.
          </Alert>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-card">
            <div className="overflow-x-auto">
              <Table
                headers={headers}
                rows={rows.map((row, i) => (
                  <tr key={i}>
                    {headers.map((h) => (
                      <td key={h} className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {row[h] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
