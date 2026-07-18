import { useEffect, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import type { Protocol } from '../services/protocols'
import { listProtocols } from '../services/protocols'

export function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProtocols() {
      try {
        const data = await listProtocols()
        setProtocols(data)
      } catch {
        setError('No se pudieron cargar los protocolos.')
      } finally {
        setLoading(false)
      }
    }

    void loadProtocols()
  }, [])

  return (
    <AppShell title="Biblioteca de protocolos">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Protocolos EMT</h2>
            <p className="text-sm text-slate-500">Aprobados, científicos e investigación.</p>
          </div>
          <Button>Nuevo protocolo</Button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {loading ? (
            <div className="p-6 text-slate-500">Cargando protocolos...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : protocols.length === 0 ? (
            <div className="p-6 text-slate-500">No hay protocolos cargados.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                headers={["Nombre", "Categoría", "Diagnóstico", "Versión", "Activo"]}
                rows={protocols.map((protocol) => (
                  <tr key={protocol.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{protocol.name}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.category}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.diagnosis || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.version}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.is_active ? 'Sí' : 'No'}</td>
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
