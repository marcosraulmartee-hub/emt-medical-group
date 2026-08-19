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
  frequency_hz: '',
  intensity_pct: '',
  duration_minutes: '',
  total_pulses: '',
  recommended_sessions: '',
  sessions_per_week: '',
  price: '',
  is_active: true,
}

type Tab = 'list' | 'pricing'

export function ProtocolsPage() {
  const [tab, setTab] = useState<Tab>('list')
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
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportError, setExportError] = useState('')

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

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, Protocol[]>()
    for (const protocol of filtered) {
      const list = groups.get(protocol.category) ?? []
      list.push(protocol)
      groups.set(protocol.category, list)
    }
    return Array.from(groups.entries())
      .map(([code, list]) => ({ code, label: categoryLabel(code), protocols: list.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [filtered, categories])

  const sortedForPricing = useMemo(() => [...filtered].sort((a, b) => a.name.localeCompare(b.name)), [filtered])

  async function handleExportExcel() {
    setExportingExcel(true)
    setExportError('')
    try {
      const XLSX = await import('xlsx')
      const rows = filtered.map((p) => ({
        Nombre: p.name,
        Categoría: categoryLabel(p.category),
        Diagnóstico: p.diagnosis || '',
        Indicación: p.indication || '',
        'Frecuencia (Hz)': p.frequency_hz ?? '',
        'Intensidad (%)': p.intensity_pct ?? '',
        'Duración (min)': p.duration_minutes ?? '',
        'Pulsos totales': p.total_pulses ?? '',
        'Sesiones recomendadas': p.recommended_sessions ?? '',
        'Sesiones por semana sugeridas': p.sessions_per_week ?? '',
        'Precio (RD$)': p.price ?? '',
        'Parámetros técnicos': p.technical_parameters || '',
        Contraindicaciones: p.contraindications || '',
        'Nivel de evidencia': p.evidence_level || '',
        Versión: p.version || '',
        Estado: p.is_active ? 'Activo' : 'Inactivo',
      }))
      const worksheet = XLSX.utils.json_to_sheet(rows)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Protocolos')
      XLSX.writeFile(workbook, `protocolos_${new Date().toISOString().slice(0, 10)}.xlsx`)
    } catch {
      setExportError('No se pudo generar el Excel. Recargá la página e intentá de nuevo.')
    } finally {
      setExportingExcel(false)
    }
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
      frequency_hz: protocol.frequency_hz != null ? String(protocol.frequency_hz) : '',
      intensity_pct: protocol.intensity_pct != null ? String(protocol.intensity_pct) : '',
      duration_minutes: protocol.duration_minutes != null ? String(protocol.duration_minutes) : '',
      total_pulses: protocol.total_pulses != null ? String(protocol.total_pulses) : '',
      recommended_sessions: protocol.recommended_sessions != null ? String(protocol.recommended_sessions) : '',
      sessions_per_week: protocol.sessions_per_week ?? '',
      price: protocol.price != null ? String(protocol.price) : '',
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
      const payload = {
        ...form,
        frequency_hz: form.frequency_hz ? Number(form.frequency_hz) : null,
        intensity_pct: form.intensity_pct ? Number(form.intensity_pct) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        total_pulses: form.total_pulses ? Number(form.total_pulses) : null,
        recommended_sessions: form.recommended_sessions ? Number(form.recommended_sessions) : null,
        sessions_per_week: form.sessions_per_week.trim() ? form.sessions_per_week.trim() : null,
        price: form.price ? Number(form.price) : null,
      }
      if (editingId) {
        await updateProtocol(editingId, payload)
      } else {
        await createProtocol(payload)
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
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportExcel} loading={exportingExcel} disabled={filtered.length === 0}>
              Exportar Excel
            </Button>
            <Button onClick={openCreate}>Nuevo protocolo</Button>
          </div>
        </div>

        <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-card sm:w-fit">
          <button
            onClick={() => setTab('list')}
            className={
              'rounded-xl px-4 py-2 text-sm font-medium transition ' +
              (tab === 'list' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
            }
          >
            Protocolos
          </button>
          <button
            onClick={() => setTab('pricing')}
            className={
              'rounded-xl px-4 py-2 text-sm font-medium transition ' +
              (tab === 'pricing' ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
            }
          >
            Precios y sesiones
          </button>
        </div>

        {exportError && <Alert variant="error">{exportError}</Alert>}

        {categories.length === 0 && !loading && (
          <Alert variant="info">
            Todavía no hay categorías de protocolo cargadas. Creá al menos una en Categorías de protocolo antes de agregar
            protocolos.
          </Alert>
        )}

        <Input
          placeholder="Buscar por nombre o diagnóstico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />

        {loading ? (
          <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-card">Cargando protocolos...</div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-6 text-red-600 shadow-card">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-white p-6 text-slate-500 shadow-card">No hay protocolos cargados.</div>
        ) : tab === 'list' ? (
          <div className="space-y-5">
            {groupedByCategory.map((group) => (
              <div key={group.code} className="overflow-hidden rounded-3xl bg-white shadow-card">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h3 className="text-sm font-semibold text-midnight-950">{group.label}</h3>
                  <p className="text-xs text-slate-400">
                    {group.protocols.length} {group.protocols.length === 1 ? 'protocolo' : 'protocolos'}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <Table
                    headers={['Nombre', 'Diagnóstico', 'Sesiones', 'Versión', 'Estado', '']}
                    rows={group.protocols.map((protocol) => (
                      <tr key={protocol.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-slate-700">{protocol.name}</td>
                        <td className="px-4 py-4 text-slate-500">{protocol.diagnosis || '—'}</td>
                        <td className="px-4 py-4 text-slate-500">{protocol.recommended_sessions ?? '—'}</td>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-card">
            <div className="overflow-x-auto">
              <Table
                headers={[
                  'Nombre',
                  'Categoría',
                  'Sesiones recomendadas',
                  'Sesiones/semana',
                  'Frecuencia (Hz)',
                  'Intensidad (%)',
                  'Duración (min)',
                  'Pulsos totales',
                  'Precio (RD$)',
                  '',
                ]}
                rows={sortedForPricing.map((protocol) => (
                  <tr key={protocol.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{protocol.name}</td>
                    <td className="px-4 py-4 text-slate-500">{categoryLabel(protocol.category)}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.recommended_sessions ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.sessions_per_week ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.frequency_hz ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.intensity_pct ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.duration_minutes ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">{protocol.total_pulses ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-500">
                      {protocol.price != null ? `RD$ ${protocol.price.toLocaleString('es-DO')}` : '—'}
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
          </div>
        )}
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

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Parámetros según la pantalla del equipo EMT
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Frecuencia (Hz)"
                type="number"
                value={form.frequency_hz}
                onChange={(e) => setForm({ ...form, frequency_hz: e.target.value })}
              />
              <Input
                label="Intensidad (%)"
                type="number"
                helper='% del umbral motor de reposo, ej. "100% MT"'
                value={form.intensity_pct}
                onChange={(e) => setForm({ ...form, intensity_pct: e.target.value })}
              />
              <Input
                label="Duración (minutos)"
                type="number"
                min={0}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
              <Input
                label="Pulsos totales"
                type="number"
                min={0}
                value={form.total_pulses}
                onChange={(e) => setForm({ ...form, total_pulses: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Sesiones y precio</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Sesiones recomendadas"
                type="number"
                min={1}
                value={form.recommended_sessions}
                onChange={(e) => setForm({ ...form, recommended_sessions: e.target.value })}
              />
              <Input
                label="Sesiones por semana sugeridas (opcional)"
                helper='Texto libre, ej. "5" o "5 (lunes a viernes)" o "3 a 5 según tolerancia"'
                value={form.sessions_per_week}
                onChange={(e) => setForm({ ...form, sessions_per_week: e.target.value })}
              />
              <Input
                label="Precio por sesión (RD$)"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <Textarea
            label="Parámetros técnicos (notas libres)"
            helper="Trenes, pulsos, duración recomendada u otras notas que no entran en los campos de arriba..."
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
