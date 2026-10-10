import { NextResponse } from 'next/server'

type BookingPayload = {
  serviceId: string
  serviceTitle: string
  barberId: string
  barberName: string
  date: string
  time: string
  name: string
  phone: string
  duration?: number
  price?: number
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validate(body: unknown): { ok: true; data: BookingPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Некорректное тело запроса' }
  }

  const b = body as Record<string, unknown>
  const required = ['serviceId', 'serviceTitle', 'barberId', 'barberName', 'date', 'time', 'name', 'phone'] as const

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
  if (!TIME_RE.test(time)) {
    return { ok: false, error: 'Некорректное время' }
  }

  const data: BookingPayload = {
    serviceId: (b.serviceId as string).trim(),
    serviceTitle: (b.serviceTitle as string).trim(),
    barberId: (b.barberId as string).trim(),
    barberName: (b.barberName as string).trim(),
    date: (b.date as string).trim(),
    time,
    name,
    phone,
  }

  if (typeof b.duration === 'number' && Number.isFinite(b.duration)) {
    data.duration = b.duration
  }
  if (typeof b.price === 'number' && Number.isFinite(b.price)) {
    data.price = b.price
  }

  return { ok: true, data }
}

function buildMessage(data: BookingPayload) {
  const lines = [
    "✂️ Новая запись — The King's Barbershop",
    '',
    `Клиент: ${data.name}`,
    `Телефон: ${data.phone}`,
    `Услуга: ${data.serviceTitle}`,
    `Барбер: ${data.barberName}`,
    `Дата: ${data.date}`,
    `Время: ${data.time}`,
  ]

  if (data.duration != null) {
    lines.push(`Длительность: ${data.duration} мин`)
  }
  if (data.price != null) {
    lines.push(`Цена: ${data.price.toLocaleString('ru-RU')} сум`)
  }

  return lines.join('\n')
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

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!token || !chatId) {
    return NextResponse.json(
      { success: false, error: 'Сервер не настроен для уведомлений (проверьте переменные окружения)' },
      { status: 500 },
    )
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(parsed.data),
      }),
    })

    const tgData = (await tgRes.json()) as { ok?: boolean; description?: string }

    if (!tgRes.ok || !tgData.ok) {
      return NextResponse.json(
        { success: false, error: 'Не удалось отправить уведомление. Попробуйте ещё раз.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Ошибка связи с Telegram. Попробуйте ещё раз.' },
      { status: 502 },
    )
  }
}
