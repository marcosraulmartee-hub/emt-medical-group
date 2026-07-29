import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, CloudRain, DollarSign, Layers, Sun, Users, Activity, CloudFog, CloudLightning, Cloud } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { StatTile } from '../components/dashboard/StatTile'
import { TodayAgenda } from '../components/dashboard/TodayAgenda'
import { BarTrendChart } from '../components/dashboard/BarTrendChart'
import { TmsInfoCard } from '../components/dashboard/TmsInfoCard'
import { RemindersCard } from '../components/dashboard/RemindersCard'
import { PendingActionsCard } from '../components/dashboard/PendingActionsCard'
import { CancelledAppointmentsCard } from '../components/dashboard/CancelledAppointmentsCard'
import { useAuth } from '../hooks/useAuth'
import { countPatients } from '../services/patients'
import { countActiveCycles } from '../services/treatmentCycles'
import type { SessionRecord } from '../services/sessions'
import { listSessionsInRange } from '../services/sessions'
import type { Appointment } from '../services/appointments'
import { listAppointmentsInRange } from '../services/appointments'
import type { Invoice } from '../services/invoices'
import { listInvoicesInRange } from '../services/invoices'
import { getUsdToDopRate, type ExchangeRate } from '../services/exchangeRate'
import { getTodayWeather, type WeatherInfo } from '../services/weather'
import { addDays, formatDayLabel, toISODate } from '../utils/dates'

const WEATHER_ICON = { clear: Sun, cloudy: Cloud, rain: CloudRain, storm: CloudLightning, fog: CloudFog }

export function DashboardPage() {
  const { can } = useAuth()

  const [loading, setLoading] = useState(true)
  const [patientsTotal, setPatientsTotal] = useState<number | null>(null)
  const [activeCycles, setActiveCycles] = useState<number | null>(null)
  const [sessionsTrend, setSessionsTrend] = useState<SessionRecord[]>([])
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [invoicesThisMonth, setInvoicesThisMonth] = useState<Invoice[]>([])
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [weather, setWeather] = useState<WeatherInfo | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const today = new Date()
      const monthStart = toISODate(new Date(today.getFullYear(), today.getMonth(), 1))
      const twoWeeksAgo = toISODate(addDays(today, -13))
      const todayISO = toISODate(today)

      const tasks: Promise<void>[] = [getUsdToDopRate().then(setExchangeRate), getTodayWeather().then(setWeather)]

      if (can('patients.view')) {
        tasks.push(countPatients().then(setPatientsTotal).catch(() => setPatientsTotal(null)))
      }
      if (can('sessions.view')) {
        tasks.push(countActiveCycles().then(setActiveCycles).catch(() => setActiveCycles(null)))
        tasks.push(listSessionsInRange(twoWeeksAgo, todayISO).then(setSessionsTrend).catch(() => setSessionsTrend([])))
      }
      if (can('agenda.view')) {
        tasks.push(listAppointmentsInRange(todayISO, todayISO).then(setTodayAppointments).catch(() => setTodayAppointments([])))
      }
      if (can('billing.view')) {
        tasks.push(listInvoicesInRange(monthStart, todayISO).then(setInvoicesThisMonth).catch(() => setInvoicesThisMonth([])))
      }

      await Promise.all(tasks)
      setLoading(false)
    }
    void load()
  }, [can])

  const sessionsByDay = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13))
    return days.map((day) => {
      const iso = toISODate(day)
      return { label: formatDayLabel(day).slice(0, 3), value: sessionsTrend.filter((s) => s.date === iso).length }
    })
  }, [sessionsTrend])

  const invoicesByDay = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13))
    return days.map((day) => {
      const iso = toISODate(day)
      const total = invoicesThisMonth.filter((inv) => inv.issue_date === iso).reduce((sum, inv) => sum + inv.total, 0)
      return { label: formatDayLabel(day).slice(0, 3), value: total }
    })
  }, [invoicesThisMonth])

  const revenueThisMonth = useMemo(() => invoicesThisMonth.reduce((sum, inv) => sum + inv.total, 0), [invoicesThisMonth])

  const WeatherIcon = weather ? WEATHER_ICON[weather.kind] : Sun

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-midnight-900">Hola, equipo EMT</h2>
          <p className="text-sm text-slate-500">Este es el resumen operativo de EMT Medical Group.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {can('patients.view') && (
            <StatTile label="Pacientes registrados" value={loading ? '—' : (patientsTotal ?? 0)} icon={Users} />
          )}
          {can('sessions.view') && (
            <StatTile label="Ciclos de tratamiento activos" value={loading ? '—' : (activeCycles ?? 0)} icon={Layers} />
          )}
          {can('agenda.view') && (
            <StatTile label="Citas de hoy" value={loading ? '—' : todayAppointments.length} icon={CalendarCheck} />
          )}
          {can('billing.view') && (
            <StatTile
              label="Facturado este mes"
              value={loading ? '—' : `RD$ ${revenueThisMonth.toLocaleString('es-DO', { maximumFractionDigits: 0 })}`}
              icon={DollarSign}
            />
          )}
          <StatTile
            label="Tasa USD → RD$"
            value={exchangeRate ? exchangeRate.rate.toFixed(2) : loading ? '—' : 'No disponible'}
            hint={exchangeRate ? 'Referencial, actualizada al momento' : undefined}
            icon={Activity}
          />
          <StatTile
            label="Clima en Santiago"
            value={weather ? `${weather.temperatureC.toFixed(0)}°C` : loading ? '—' : 'No disponible'}
            hint={weather?.description}
            icon={WeatherIcon}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {can('agenda.view') && <TodayAgenda appointments={todayAppointments} />}
          {can('sessions.view') ? (
            <BarTrendChart title="Sesiones — últimos 14 días" data={sessionsByDay} />
          ) : can('billing.view') ? (
            <BarTrendChart
              title="Facturación — últimos 14 días"
              subtitle="RD$ por día, facturas emitidas"
              data={invoicesByDay}
            />
          ) : null}
        </div>

        {(can('agenda.view') || can('reminders.view')) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {can('agenda.view') && <PendingActionsCard showFollowUp={can('patients.view')} />}
            {can('reminders.view') && <RemindersCard />}
          </div>
        )}

        {can('stats.view') && (
          <div className="grid gap-6 lg:grid-cols-2">
            <CancelledAppointmentsCard />
          </div>
        )}

        <TmsInfoCard />
      </div>
    </AppShell>
  )
}
