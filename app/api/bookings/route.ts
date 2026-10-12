import { randomUUID } from 'crypto'
import { and, asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
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
import { getDb } from '@/lib/db'
import { bookings } from '@/lib/db/schema'

type BookingPayload = {
  serviceId: string
  barberId: string
  date: string
  time: string
  name: string
  phone: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validate(body: unknown): { ok: true; data: BookingPayload } | { ok: false; error: string } {
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
  if (!DATE_RE.test(date) || !isDateBookable(date)) {
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

function buildMessage(params: {
  name: string
  phone: string
  serviceTitle: string
  barberName: string
  dateIso: string
  time: string
  duration: number
  priceLabel: string
}) {
  return [
    "✂️ Новая запись — The King's Barbershop",
    '',
    `👤 Клиент: ${params.name}`,
    `📞 Телефон: ${params.phone}`,
    `💇 Услуга: ${params.serviceTitle}`,
    `💈 Барбер: ${params.barberName}`,
    `📅 Дата: ${formatDateRu(params.dateIso)}`,
    `⏰ Время: ${params.time}`,
    `⏱ Длительность: ${params.duration} мин`,
    `💰 Цена: ${params.priceLabel}`,
  ].join('\n')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const barberId = searchParams.get('barberId')?.trim() ?? ''
  const date = searchParams.get('date')?.trim() ?? ''

  // Occupancy mode: ?barberId=&date=
  if (barberId || date) {
    if (!barberId || !findBarber(barberId)) {
      return NextResponse.json({ success: false, error: 'Некорректный barberId' }, { status: 400 })
    }
    if (!DATE_RE.test(date)) {
      return NextResponse.json({ success: false, error: 'Некорректная date (ожидается YYYY-MM-DD)' }, { status: 400 })
    }

    try {
      const db = getDb()
      const rows = await db
        .select({
          startTime: bookings.startTime,
          durationMinutes: bookings.durationMinutes,
        })
        .from(bookings)
        .where(and(eq(bookings.barberId, barberId), eq(bookings.date, date)))

      return NextResponse.json({ success: true, bookings: rows })
    } catch (err) {
      console.error('GET /api/bookings', err)
      return NextResponse.json(
        { success: false, error: 'Не удалось загрузить занятость. Проверьте DATABASE_URL.' },
        { status: 500 },
      )
    }
  }

  // List mode (public table — no name/phone)
  try {
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

    const list = rows.map((row) => {
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

    return NextResponse.json({ success: true, bookings: list })
  } catch (err) {
    console.error('GET /api/bookings list', err)
    return NextResponse.json(
      { success: false, error: 'Не удалось загрузить записи. Проверьте DATABASE_URL.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Некорректный JSON' }, { status: 400 })
  }

  const parsed = validate(json)
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 })
  }

  const { data } = parsed
  const service = findService(data.serviceId)!
  const barber = findBarber(data.barberId)!
  const durationMinutes = service.duration

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!token || !chatId) {
    return NextResponse.json(
      { success: false, error: 'Сервер не настроен для уведомлений (проверьте переменные окружения)' },
      { status: 500 },
    )
  }

  try {
    const db = getDb()
    const existing = await db
      .select({
        startTime: bookings.startTime,
        durationMinutes: bookings.durationMinutes,
      })
      .from(bookings)
      .where(and(eq(bookings.barberId, data.barberId), eq(bookings.date, data.date)))

    if (slotOverlapsBusy(data.time, durationMinutes, existing)) {
      return NextResponse.json(
        { success: false, error: 'Это время уже занято. Выберите другой слот.' },
        { status: 409 },
      )
    }

    await db.insert(bookings).values({
      id: randomUUID(),
      barberId: data.barberId,
      date: data.date,
      startTime: data.time,
      durationMinutes,
      serviceId: data.serviceId,
      name: data.name,
      phone: data.phone,
    })

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage({
          name: data.name,
          phone: data.phone,
          serviceTitle: service.title,
          barberName: barber.name,
          dateIso: data.date,
          time: data.time,
          duration: durationMinutes,
          priceLabel: formatPrice(service),
        }),
      }),
    })

    const tgData = (await tgRes.json()) as { ok?: boolean; description?: string }

    if (!tgRes.ok || !tgData.ok) {
      return NextResponse.json(
        { success: false, error: 'Запись сохранена, но не удалось отправить уведомление в Telegram.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/bookings', err)
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения записи. Проверьте DATABASE_URL.' },
      { status: 500 },
    )
  }
}
