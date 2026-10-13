import { randomUUID } from 'crypto'
import { and, asc, eq, gte, lte } from 'drizzle-orm'
import {
  DATE_RE,
  TIME_RE,
  findBarber,
  findService,
  formatDateRu,
  isDateBookable,
  isValidTimeSlot,
  slotOverlapsBusy,
} from '@/lib/booking'
import { formatPrice } from '@/lib/data'
import {
  blocksToBusyIntervals,
  isDayFullyBlocked,
  isValidBlockRange,
  slotOverlapsBlocks,
  type AvailabilityBlockLike,
} from '@/lib/availability'
import { getDb } from '@/lib/db'
import { availabilityBlocks, bookings } from '@/lib/db/schema'

export type BookingPayload = {
  serviceId: string
  barberId: string
  date: string
  time: string
  name: string
  phone: string
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateBookingPayload(
  body: unknown,
  options?: { relaxDateHorizon?: boolean },
): { ok: true; data: BookingPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Некорректное тело запроса' }
  }

  const b = body as Record<string, unknown>
  const required = ['serviceId', 'barberId', 'date', 'time', 'name', 'phone'] as const

  for (const key of required) {
    if (!isNonEmptyString(b[key])) {
      return { ok: false, error: `Поле «${key}» обязательно` }
    }
  }

  const name = (b.name as string).trim()
  if (name.length < 2) {
    return { ok: false, error: 'Имя должно содержать не менее 2 символов' }
  }

  const phone = (b.phone as string).trim()
  if (phone.replace(/\D/g, '').length < 12) {
    return { ok: false, error: 'Укажите корректный номер телефона' }
  }

  const time = (b.time as string).trim()
  if (!TIME_RE.test(time) || !isValidTimeSlot(time)) {
    return { ok: false, error: 'Некорректное время' }
  }

  const date = (b.date as string).trim()
  if (!DATE_RE.test(date)) {
    return { ok: false, error: 'Некорректная дата' }
  }
  if (!options?.relaxDateHorizon && !isDateBookable(date)) {
    return { ok: false, error: 'Некорректная или недоступная дата' }
  }

  const serviceId = (b.serviceId as string).trim()
  if (!findService(serviceId)) {
    return { ok: false, error: 'Неизвестная услуга' }
  }

  const barberId = (b.barberId as string).trim()
  if (!findBarber(barberId)) {
    return { ok: false, error: 'Неизвестный барбер' }
  }

  return {
    ok: true,
    data: { serviceId, barberId, date, time, name, phone },
  }
}

export async function getBusyForBarberDate(barberId: string, date: string) {
  const db = getDb()
  const [busyRows, blockRows] = await Promise.all([
    db
      .select({
        startTime: bookings.startTime,
        durationMinutes: bookings.durationMinutes,
      })
      .from(bookings)
      .where(and(eq(bookings.barberId, barberId), eq(bookings.date, date))),
    db
      .select({
        startTime: availabilityBlocks.startTime,
        endTime: availabilityBlocks.endTime,
      })
      .from(availabilityBlocks)
      .where(and(eq(availabilityBlocks.barberId, barberId), eq(availabilityBlocks.date, date))),
  ])

  const blocks: AvailabilityBlockLike[] = blockRows.map((row) => ({
    startTime: row.startTime,
    endTime: row.endTime,
  }))

  return {
    bookings: busyRows,
    blocks,
    dayBlocked: isDayFullyBlocked(blocks),
    busyWithBlocks: [...busyRows, ...blocksToBusyIntervals(blocks)],
  }
}

export async function getBlockedDatesForBarber(barberId: string, from: string, to: string) {
  const db = getDb()
  const rows = await db
    .select({
      date: availabilityBlocks.date,
      startTime: availabilityBlocks.startTime,
      endTime: availabilityBlocks.endTime,
    })
    .from(availabilityBlocks)
    .where(
      and(
        eq(availabilityBlocks.barberId, barberId),
        gte(availabilityBlocks.date, from),
        lte(availabilityBlocks.date, to),
      ),
    )

  const byDate = new Map<string, AvailabilityBlockLike[]>()
  for (const row of rows) {
    const list = byDate.get(row.date) ?? []
    list.push({ startTime: row.startTime, endTime: row.endTime })
    byDate.set(row.date, list)
  }

  const fullyBlockedDates: string[] = []
  for (const [date, blocks] of byDate) {
    if (isDayFullyBlocked(blocks)) fullyBlockedDates.push(date)
  }

  return { fullyBlockedDates, blocksByDate: Object.fromEntries(byDate) }
}

export async function createBookingRecord(
  data: BookingPayload,
  options?: { requireTelegram?: boolean },
): Promise<
  | { ok: true; id: string; telegramOk: boolean; telegramError?: string }
  | { ok: false; error: string; status: number }
> {
  const service = findService(data.serviceId)!
  const barber = findBarber(data.barberId)!
  const durationMinutes = service.duration
  const requireTelegram = options?.requireTelegram !== false

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (requireTelegram && (!token || !chatId)) {
    return {
      ok: false,
      error: 'Сервер не настроен для уведомлений (проверьте переменные окружения)',
      status: 500,
    }
  }

  const db = getDb()
  const occupancy = await getBusyForBarberDate(data.barberId, data.date)

  if (occupancy.dayBlocked || slotOverlapsBlocks(data.time, durationMinutes, occupancy.blocks)) {
    return {
      ok: false,
      error: 'Это время недоступно: барбер заблокирован. Выберите другой слот.',
      status: 409,
    }
  }

  if (slotOverlapsBusy(data.time, durationMinutes, occupancy.bookings)) {
    return {
      ok: false,
      error: 'Это время уже занято. Выберите другой слот.',
      status: 409,
    }
  }

  const id = randomUUID()
  await db.insert(bookings).values({
    id,
    barberId: data.barberId,
    date: data.date,
    startTime: data.time,
    durationMinutes,
    serviceId: data.serviceId,
    name: data.name,
    phone: data.phone,
  })

  let telegramOk = true
  let telegramError: string | undefined

  if (token && chatId) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: [
            "✂️ Новая запись — The King's Barbershop",
            '',
            `👤 Клиент: ${data.name}`,
            `📞 Телефон: ${data.phone}`,
            `💇 Услуга: ${service.title}`,
            `💈 Барбер: ${barber.name}`,
            `📅 Дата: ${formatDateRu(data.date)}`,
            `⏰ Время: ${data.time}`,
            `⏱ Длительность: ${durationMinutes} мин`,
            `💰 Цена: ${formatPrice(service)}`,
          ].join('\n'),
        }),
      })
      const tgData = (await tgRes.json()) as { ok?: boolean; description?: string }
      if (!tgRes.ok || !tgData.ok) {
        telegramOk = false
        telegramError = 'Запись сохранена, но не удалось отправить уведомление в Telegram.'
      }
    } catch {
      telegramOk = false
      telegramError = 'Запись сохранена, но не удалось отправить уведомление в Telegram.'
    }
  }

  if (requireTelegram && !telegramOk) {
    return { ok: false, error: telegramError!, status: 502 }
  }

  return { ok: true, id, telegramOk, telegramError }
}

export async function listPublicBookings() {
  const db = getDb()
  const rows = await db
    .select({
      serviceId: bookings.serviceId,
      barberId: bookings.barberId,
      date: bookings.date,
      startTime: bookings.startTime,
      durationMinutes: bookings.durationMinutes,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .orderBy(asc(bookings.date), asc(bookings.startTime))

  return rows.map((row) => {
    const service = findService(row.serviceId)
    const barber = findBarber(row.barberId)
    return {
      ...row,
      serviceTitle: service?.title ?? row.serviceId,
      barberName: barber?.name ?? row.barberId,
      price: service?.price ?? 0,
      priceMax: service?.priceMax,
      priceFrom: service?.priceFrom ?? false,
      createdAt: row.createdAt.toISOString(),
    }
  })
}

export async function listAdminBookings() {
  const db = getDb()
  const rows = await db
    .select()
    .from(bookings)
    .orderBy(asc(bookings.date), asc(bookings.startTime))

  return rows.map((row) => {
    const service = findService(row.serviceId)
    const barber = findBarber(row.barberId)
    return {
      id: row.id,
      serviceId: row.serviceId,
      barberId: row.barberId,
      date: row.date,
      startTime: row.startTime,
      durationMinutes: row.durationMinutes,
      name: row.name,
      phone: row.phone,
      serviceTitle: service?.title ?? row.serviceId,
      barberName: barber?.name ?? row.barberId,
      price: service?.price ?? 0,
      priceMax: service?.priceMax,
      priceFrom: service?.priceFrom ?? false,
      createdAt: row.createdAt.toISOString(),
    }
  })
}

export async function deleteBooking(id: string): Promise<boolean> {
  const db = getDb()
  const deleted = await db.delete(bookings).where(eq(bookings.id, id)).returning({ id: bookings.id })
  return deleted.length > 0
}

export { isValidBlockRange }
