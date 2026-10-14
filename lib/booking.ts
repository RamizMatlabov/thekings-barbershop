import { barbers, services } from '@/lib/data'

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const BOOKING_HORIZON_MONTHS = 2
/** Slot grid step (09:00, 09:45, 10:30, …). */
export const SLOT_STEP_MINUTES = 45
export const SLOT_DAY_START_MINUTES = 9 * 60
export const SLOT_DAY_END_MINUTES = 21 * 60

export function buildTimeSlots(
  startMinutes = SLOT_DAY_START_MINUTES,
  endMinutes = SLOT_DAY_END_MINUTES,
  step = SLOT_STEP_MINUTES,
): string[] {
  const slots: string[] = []
  for (let m = startMinutes; m <= endMinutes; m += step) {
    slots.push(
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
    )
  }
  return slots
}

export function isValidTimeSlot(time: string): boolean {
  return buildTimeSlots().includes(time)
}

export type BusyInterval = {
  startTime: string
  durationMinutes: number
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

/** Slot at `startTime` with `durationMinutes` overlaps any busy interval. */
export function slotOverlapsBusy(
  startTime: string,
  durationMinutes: number,
  busy: BusyInterval[],
): boolean {
  const start = timeToMinutes(startTime)
  const end = start + durationMinutes
  return busy.some((b) => {
    const bStart = timeToMinutes(b.startTime)
    const bEnd = bStart + b.durationMinutes
    return intervalsOverlap(start, end, bStart, bEnd)
  })
}

/** Local calendar date as YYYY-MM-DD (no UTC shift). */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(iso: string): Date | null {
  if (!DATE_RE.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null
  }
  return date
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function bookingMaxDate(from = new Date()): Date {
  const max = startOfDay(from)
  max.setMonth(max.getMonth() + BOOKING_HORIZON_MONTHS)
  return max
}

export function isDateBookable(iso: string, today = new Date()): boolean {
  const date = parseISODate(iso)
  if (!date) return false
  const min = startOfDay(today)
  const max = bookingMaxDate(today)
  const t = startOfDay(date).getTime()
  return t >= min.getTime() && t <= max.getTime()
}

export function formatDateRu(iso: string): string {
  const date = parseISODate(iso)
  if (!date) return iso
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function findService(id: string) {
  return services.find((s) => s.id === id) ?? null
}

/** Split stored `service_id` (single or comma-separated) into unique ids. */
export function parseServiceIds(value: string): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const part of value.split(',')) {
    const id = part.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

export function findServices(ids: string[]) {
  return ids.map((id) => findService(id)).filter((s): s is NonNullable<typeof s> => s != null)
}

/** Aggregate titles, duration and price for one or more selected services. */
export function summarizeServices(ids: string[]) {
  const list = findServices(ids)
  if (list.length === 0) return null

  const durationMinutes = list.reduce((sum, s) => sum + s.duration, 0)
  const price = list.reduce((sum, s) => sum + s.price, 0)
  const priceMaxSum = list.reduce((sum, s) => sum + (s.priceMax ?? s.price), 0)
  const priceMax = priceMaxSum !== price ? priceMaxSum : undefined
  const priceFrom = list.some((s) => Boolean(s.priceFrom))
  const title = list.map((s) => s.title).join(', ')

  return {
    list,
    durationMinutes,
    price,
    priceMax,
    priceFrom,
    title,
    serviceId: ids.join(','),
  }
}

export function findBarber(id: string) {
  return barbers.find((b) => b.id === id) ?? null
}
