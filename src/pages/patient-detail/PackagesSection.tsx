import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import type { SessionPackage } from '../../services/sessionPackages'
import { createSessionPackage, listPatientPackages } from '../../services/sessionPackages'
import type { Protocol } from '../../services/protocols'
import { listProtocols } from '../../services/protocols'
import type { ProtocolCategory } from '../../services/protocolCategories'
import { listProtocolCategories } from '../../services/protocolCategories'
import { ProtocolPicker } from '../../components/protocols/ProtocolPicker'

const STATUS_LABEL: Record<SessionPackage['status'], string> = {
  active: 'Activo',
  completed: 'Completado',
  expired: 'Vencido',
  cancelled: 'Cancelado',
}

const STATUS_TONE: Record<SessionPackage['status'], 'success' | 'neutral' | 'warning' | 'danger'> = {
  active: 'success',
  completed: 'neutral',
  expired: 'warning',
  cancelled: 'danger',
}

const emptyForm = { name: '', protocol_id: '', total_sessions: 10, price: 0 }

export function PackagesSection({ patientId }: { patientId: string }) {
  const [packages, setPackages] = useState<SessionPackage[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [protocolCategories, setProtocolCategories] = useState<ProtocolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [pkgs, pr, cats] = await Promise.all([listPatientPackages(patientId), listProtocols(), listProtocolCategories()])
      setPackages(pkgs)
      setProtocols(pr)
      setProtocolCategories(cats)
    } catch {
      setError('No se pudieron cargar los paquetes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [patientId])

  async function handleAdd() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await createSessionPackage({
        patient_id: patientId,
        protocol_id: form.protocol_id || null,
        name: form.name,
        total_sessions: form.total_sessions,
        price: form.price,
        invoice_id: null,
      })
      setForm(emptyForm)
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo registrar el paquete.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Paquetes de sesiones</h3>
          <p className="text-sm text-slate-500">Bonos comprados y su consumo. Facturalos desde Facturación.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Vender paquete
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : packages.length === 0 ? (
        <p className="text-sm text-slate-500">Sin paquetes registrados.</p>
      ) : (
        <ul className="space-y-3">
          {packages.map((pkg) => (
            <li key={pkg.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-medium text-midnight-950">{pkg.name}</p>
                <p className="text-xs text-slate-500">
                  {pkg.used_sessions} de {pkg.total_sessions} sesiones usadas · {pkg.protocol?.name ?? 'sin protocolo'} ·{' '}
                  {pkg.price.toFixed(2)}
                </p>
              </div>
              <Badge tone={STATUS_TONE[pkg.status]}>{STATUS_LABEL[pkg.status]}</Badge>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        title="Vender paquete de sesiones"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} loading={saving} disabled={!form.name.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre del paquete" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <ProtocolPicker
            label="Protocolo (opcional)"
            protocols={protocols}
            categories={protocolCategories}
            value={form.protocol_id}
            onChange={(protocolId) => setForm({ ...form, protocol_id: protocolId })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Sesiones incluidas"
              type="number"
              value={form.total_sessions}
              onChange={(e) => setForm({ ...form, total_sessions: Number(e.target.value) })}
            />
            <Input label="Precio" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
