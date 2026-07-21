import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import type { Protocol } from '../services/protocols'
import { createProtocol, listProtocols, updateProtocol } from '../services/protocols'
import type { ProtocolCategory } from '../services/protocolCategories'
import { listProtocolCategories } from '../services/protocolCategories'

const emptyForm = {
  name: '',
  category: '',
  diagnosis: '',
  indication: '',
  objective: '',
  technical_parameters: '',
  contraindications: '',
  precautions: '',
  adverse_events: '',
  evidence_level: '',
  bibliography: '',
  clinical_guidelines: '',
  regulatory_body: '',
  version: '1.0',
  is_active: true,
}

export function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [categories, setCategories] = useState<ProtocolCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [protocolData, categoryData] = await Promise.all([listProtocols(), listProtocolCategories()])
      setProtocols(protocolData)
      setCategories(categoryData)
    } catch {
      setError('No se pudieron cargar los protocolos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return protocols
    return protocols.filter(
      (p) => p.name.toLowerCase().includes(term) || (p.diagnosis ?? '').toLowerCase().includes(term),
    )
  }, [search, protocols])

  function categoryLabel(code: string) {
    return categories.find((c) => c.code === code)?.label ?? code
  }

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, category: categories[0]?.code ?? '' })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(protocol: Protocol) {
    setEditingId(protocol.id)
    setForm({
      name: protocol.name,
      category: protocol.category,
      diagnosis: protocol.diagnosis ?? '',
      indication: protocol.indication ?? '',
      objective: protocol.objective ?? '',
      technical_parameters: protocol.technical_parameters ?? '',
      contraindications: protocol.contraindications ?? '',
      precautions: protocol.precautions ?? '',
      adverse_events: protocol.adverse_events ?? '',
      evidence_level: protocol.evidence_level ?? '',
      bibliography: protocol.bibliography ?? '',
      clinical_guidelines: protocol.clinical_guidelines ?? '',
      regulatory_body: protocol.regulatory_body ?? '',
      version: protocol.version ?? '1.0',
      is_active: protocol.is_active,
    })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.category) {
      setFormError('Nombre y categoría son obligatorios.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      if (editingId) {
        await updateProtocol(editingId, form)
      } else {
        await createProtocol(form)
      }
      setModalOpen(false)
      await load()
    } catch {
      setFormError('No se pudo guardar el protocolo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Biblioteca de protocolos">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-midnight-950">Protocolos EMT</h2>
            <p className="text-sm text-slate-500">rTMS, iTBS, cTBS y demás técnicas de neuromodulación.</p>
          </div>
          <Button onClick={openCreate}>Nuevo protocolo</Button>
        </div>

        {categories.length === 0 && !loading && (
          <Alert variant="info">
            Todavía no hay categorías de protocolo cargadas. Creá al menos una en Configuración → Categorías de protocolo antes
            de agregar protocolos.
          </Alert>
        )}

        <Input
          placeholder="Buscar por nombre o diagnóstico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />

        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {loading ? (
            <div className="p-6 text-slate-500">Cargando protocolos...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-slate-500">No hay protocolos cargados.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                headers={['Nombre', 'Categoría', 'Diagnóstico', 'Versión', 'Estado', '']}
                rows={filtered.map((protocol) => (
                  <tr key={protocol.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{protocol.name}</td>
                    <td className="px-4 py-4 text-slate-500">{categoryLabel(protocol.category)}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.diagnosis || '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.version}</td>
                    <td className="px-4 py-4">
                      <Badge tone={protocol.is_active ? 'success' : 'neutral'}>
                        {protocol.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-sm text-teal-600 hover:underline" onClick={() => openEdit(protocol)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar protocolo' : 'Nuevo protocolo'}
        size="lg"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select
              label="Categoría"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Seleccioná una categoría</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Diagnóstico" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
            <Input label="Indicación" value={form.indication} onChange={(e) => setForm({ ...form, indication: e.target.value })} />
          </div>
          <Textarea label="Objetivo" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
          <Textarea
            label="Parámetros técnicos"
            helper="Frecuencia, intensidad, trenes, pulsos, duración recomendada..."
            value={form.technical_parameters}
            onChange={(e) => setForm({ ...form, technical_parameters: e.target.value })}
          />
          <Textarea
            label="Contraindicaciones"
            value={form.contraindications}
            onChange={(e) => setForm({ ...form, contraindications: e.target.value })}
          />
          <Textarea
            label="Precauciones"
            value={form.precautions}
            onChange={(e) => setForm({ ...form, precautions: e.target.value })}
          />
          <Textarea
            label="Eventos adversos esperables"
            value={form.adverse_events}
            onChange={(e) => setForm({ ...form, adverse_events: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nivel de evidencia"
              value={form.evidence_level}
              onChange={(e) => setForm({ ...form, evidence_level: e.target.value })}
            />
            <Input
              label="Organismo regulador"
              value={form.regulatory_body}
              onChange={(e) => setForm({ ...form, regulatory_body: e.target.value })}
            />
          </div>
          <Textarea
            label="Guías clínicas"
            value={form.clinical_guidelines}
            onChange={(e) => setForm({ ...form, clinical_guidelines: e.target.value })}
          />
          <Textarea
            label="Bibliografía"
            value={form.bibliography}
            onChange={(e) => setForm({ ...form, bibliography: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Versión" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <Select
              label="Estado"
              value={form.is_active ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
