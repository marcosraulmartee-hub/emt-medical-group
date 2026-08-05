import type { Appointment } from './appointments'
import { minutesToTime, timeToMinutes } from '../utils/timeGrid'

export const SLOT_MINUTES = 35
export const WORK_START_MIN = 9 * 60
export const WORK_END_MIN = 18 * 60

export interface AvailabilitySlot {
  startMin: number
  endMin: number
  start: string
  end: string
  occupied: boolean
  appointment: Appointment | null
}

/** Horario base del día: bloques de 35 min entre 9:00 y 6:00 p.m., sin excederlo. */
export function generateSlotTemplate(): { startMin: number; endMin: number }[] {
  const slots: { startMin: number; endMin: number }[] = []
  for (let t = WORK_START_MIN; t + SLOT_MINUTES <= WORK_END_MIN; t += SLOT_MINUTES) {
    slots.push({ startMin: t, endMin: t + SLOT_MINUTES })
  }
  return slots
}

export function buildDayAvailability(appointments: Appointment[]): AvailabilitySlot[] {
  const active = appointments.filter((a) => a.status !== 'cancelled')
  return generateSlotTemplate().map(({ startMin, endMin }) => {
    const appointment =
      active.find((a) => {
        const aStart = timeToMinutes(a.start_time)
        const aEnd = a.end_time ? timeToMinutes(a.end_time) : aStart + SLOT_MINUTES
        return aStart < endMin && aEnd > startMin
      }) ?? null
    return { startMin, endMin, start: minutesToTime(startMin), end: minutesToTime(endMin), occupied: !!appointment, appointment }
  })
}

export interface DayAvailabilitySummary {
  date: string
  total: number
  free: number
  occupied: number
}

export function buildWeekAvailability(appointmentsByDate: Map<string, Appointment[]>): DayAvailabilitySummary[] {
  const total = generateSlotTemplate().length
  return Array.from(appointmentsByDate.entries()).map(([date, appointments]) => {
    const slots = buildDayAvailability(appointments)
    const occupied = slots.filter((s) => s.occupied).length
    return { date, total, occupied, free: total - occupied }
  })
}
