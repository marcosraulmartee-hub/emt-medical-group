import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { HeadMap1020 } from './HeadMap1020'

export interface SessionParametersValues {
  stimulated_region: string
  laterality: string
  frequency_hz: string
  intensity_pct: string
  rmt_pct: string
  pulses: string
  totalPulses: string
  duration_minutes: string
}

export function computeTrains(values: Pick<SessionParametersValues, 'pulses' | 'totalPulses'>) {
  const pulsesPerTrain = values.pulses ? Number(values.pulses) : null
  const totalPulses = values.totalPulses ? Number(values.totalPulses) : null
  const trainsExact = pulsesPerTrain && totalPulses ? totalPulses / pulsesPerTrain : null
  const trainsRounded = trainsExact !== null ? Math.round(trainsExact) : null
  const trainsMismatch = trainsExact !== null && trainsRounded !== null && Math.abs(trainsExact - trainsRounded) > 0.01
  return { trainsRounded, trainsMismatch }
}

export function SessionParametersFields({
  values,
  onChange,
  onError,
}: {
  values: SessionParametersValues
  onChange: (patch: Partial<SessionParametersValues>) => void
  onError: (message: string) => void
}) {
  const [showHeadMap, setShowHeadMap] = useState(false)
  const [downloadingGuide, setDownloadingGuide] = useState(false)
  const { trainsRounded, trainsMismatch } = computeTrains(values)

  async function handleDownloadGuide() {
    setDownloadingGuide(true)
    try {
      const { downloadSessionParametersGuidePdf } = await import('../../utils/sessionParametersGuidePdf')
      downloadSessionParametersGuidePdf()
    } catch {
      onError('No se pudo generar la guía. Recargá la página e intentá de nuevo.')
    } finally {
      setDownloadingGuide(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <Input
            label="Región estimulada"
            value={values.stimulated_region}
            onChange={(e) => onChange({ stimulated_region: e.target.value })}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={() => setShowHeadMap((v) => !v)}>
            {showHeadMap ? 'Ocultar mapa' : 'Marcar en mapa 10-20'}
          </Button>
        </div>
        <Select label="Lateralidad" value={values.laterality} onChange={(e) => onChange({ laterality: e.target.value })}>
          <option value="">Sin especificar</option>
          <option value="izquierda">Izquierda</option>
          <option value="derecha">Derecha</option>
          <option value="bilateral">Bilateral</option>
        </Select>
      </div>

      {showHeadMap && (
        <HeadMap1020
          value={values.stimulated_region}
          onSelect={(code, laterality) => onChange({ stimulated_region: code, laterality: laterality || values.laterality })}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Parámetros de estimulación</p>
        <Button type="button" size="sm" variant="ghost" onClick={handleDownloadGuide} loading={downloadingGuide}>
          ¿Cómo leo estos campos? (PDF)
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Frecuencia (Hz)"
          type="number"
          max={100}
          helper="Neuro-MSX SLIM: hasta 100 Hz"
          value={values.frequency_hz}
          onChange={(e) => onChange({ frequency_hz: e.target.value })}
        />
        <Input
          label="Intensidad (%)"
          type="number"
          min={1}
          max={150}
          helper='Ej. "100% MT" en la pantalla del equipo — % del umbral motor de reposo'
          value={values.intensity_pct}
          onChange={(e) => onChange({ intensity_pct: e.target.value })}
        />
        <Input
          label="Umbral motor en reposo — RMT (% MSO)"
          type="number"
          helper="Medido en la pestaña UM del equipo, antes de iniciar la estimulación"
          value={values.rmt_pct}
          onChange={(e) => onChange({ rmt_pct: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Pulsos por tren"
          type="number"
          helper='Ej. "30" en "30 x 10,0 Hz" en la pantalla del equipo'
          value={values.pulses}
          onChange={(e) => onChange({ pulses: e.target.value })}
        />
        <Input
          label="Total de pulsos"
          type="number"
          helper='El número grande de "___ pulsos" en la pantalla del equipo — no la frecuencia en Hz'
          value={values.totalPulses}
          onChange={(e) => onChange({ totalPulses: e.target.value })}
        />
        <Input
          label="Número de trenes"
          type="number"
          disabled
          helper={trainsMismatch ? undefined : 'Total de pulsos ÷ pulsos por tren (automático)'}
          error={trainsMismatch ? 'No divide exacto — revisá pulsos por tren y total de pulsos' : undefined}
          value={trainsRounded !== null ? String(trainsRounded) : ''}
          onChange={() => {}}
        />
      </div>
      <Input
        label="Duración (minutos)"
        type="number"
        value={values.duration_minutes}
        onChange={(e) => onChange({ duration_minutes: e.target.value })}
      />
    </>
  )
}
