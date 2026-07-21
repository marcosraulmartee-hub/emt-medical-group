import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import type { ClinicalScale } from '../../services/clinicalScales'
import { createClinicalScale, listClinicalScales, updateClinicalScale, uploadScalePdf } from '../../services/clinicalScales'

const emptyForm = { code: '', label: '', description: '', pdf_url: '', pdf_url_es: '' }

export function ClinicalScalesSection() {
  const [items, setItems] = useState<ClinicalScale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<'pdf_url' | 'pdf_url_es' | null>(null)
  const [downloadingGuide, setDownloadingGuide] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listClinicalScales())
    } catch {
      setError('No se pudieron cargar las escalas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(item: ClinicalScale) {
    setEditingId(item.id)
    setForm({
      code: item.code,
      label: item.label,
      description: item.description ?? '',
      pdf_url: item.pdf_url ?? '',
      pdf_url_es: item.pdf_url_es ?? '',
    })
    setModalOpen(true)
  }

  async function handleDownloadGuide() {
    setDownloadingGuide(true)
    setError('')
    try {
      const { downloadScaleGuidePdf } = await import('../../utils/scaleGuidePdf')
      downloadScaleGuidePdf()
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : String(err)
      setError(`No se pudo generar la guía: ${message}`)
    } finally {
      setDownloadingGuide(false)
    }
  }

  async function handleFileUpload(file: File, field: 'pdf_url' | 'pdf_url_es') {
    const code = form.code.trim()
    if (!code) {
      setError('Completá el código de la escala antes de subir el PDF.')
      return
    }
    setUploadingField(field)
    setError('')
    try {
      const url = await uploadScalePdf(`${code}${field === 'pdf_url_es' ? '-es' : ''}`, file)
      setForm((prev) => ({ ...prev, [field]: url }))
    } catch {
      setError('No se pudo subir el archivo.')
    } finally {
      setUploadingField(null)
    }
  }

  async function handleSubmit() {
    if (!form.label.trim() || (!editingId && !form.code.trim())) return
    setSaving(true)
    try {
      if (editingId) {
        await updateClinicalScale(editingId, form)
      } else {
        await createClinicalScale(form)
      }
      setModalOpen(false)
      await load()
    } catch {
      setError('No se pudo guardar la escala.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-midnight-950">Escalas clínicas</h3>
          <p className="text-sm text-slate-500">Catálogo disponible para registrar puntajes, con el cuestionario en inglés y español.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleDownloadGuide} loading={downloadingGuide}>
            Guía protocolar (PDF)
          </Button>
          <Button size="sm" onClick={openCreate}>
            Nueva escala
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        {loading ? (
          <div className="p-6 text-slate-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-500">No hay escalas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              headers={['Código', 'Nombre', 'Descripción', 'Cuestionario', '']}
              rows={items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-700">{item.code}</td>
                  <td className="px-4 py-4 text-slate-500">{item.label}</td>
                  <td className="px-4 py-4 text-slate-500">{item.description || '—'}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {item.pdf_url && (
                        <a href={item.pdf_url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="secondary">
                            Inglés
                          </Button>
                        </a>
                      )}
                      {item.pdf_url_es && (
                        <a href={item.pdf_url_es} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="secondary">
                            Español
                          </Button>
                        </a>
                      )}
                      {!item.pdf_url && !item.pdf_url_es && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="text-sm text-teal-600 hover:underline" onClick={() => openEdit(item)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Editar escala clínica' : 'Nueva escala clínica'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={saving} disabled={!form.label.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Código"
            required
            disabled={!!editingId}
            helper={editingId ? 'El código no se puede modificar.' : 'ej: hars'}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <Input label="Nombre" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Textarea label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-medium text-midnight-950">Cuestionario — Inglés</p>
            <Input
              label="URL"
              value={form.pdf_url}
              onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
            />
            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">O subí el archivo</label>
              <input
                type="file"
                accept="application/pdf"
                disabled={uploadingField === 'pdf_url'}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFileUpload(file, 'pdf_url')
                }}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-2xl file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
              />
              {uploadingField === 'pdf_url' && <p className="mt-1 text-xs text-slate-400">Subiendo...</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-medium text-midnight-950">Cuestionario — Español</p>
            <Input
              label="URL"
              value={form.pdf_url_es}
              onChange={(e) => setForm({ ...form, pdf_url_es: e.target.value })}
            />
            <div className="mt-3">
              <label className="mb-1.5 block text-sm font-medium text-slate-600">O subí el archivo</label>
              <input
                type="file"
                accept="application/pdf"
                disabled={uploadingField === 'pdf_url_es'}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFileUpload(file, 'pdf_url_es')
                }}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-2xl file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
              />
              {uploadingField === 'pdf_url_es' && <p className="mt-1 text-xs text-slate-400">Subiendo...</p>}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
