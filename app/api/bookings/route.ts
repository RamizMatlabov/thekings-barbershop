import { NextResponse } from 'next/server'
import { DATE_RE, findBarber } from '@/lib/booking'
import {
  createBookingRecord,
  getBlockedDatesForBarber,
  getBusyForBarberDate,
  listPublicBookings,
  validateBookingPayload,
} from '@/lib/booking-service'
import { bookingMaxDate, startOfDay, toISODate } from '@/lib/booking'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const barberId = searchParams.get('barberId')?.trim() ?? ''
  const date = searchParams.get('date')?.trim() ?? ''
  const mode = searchParams.get('mode')?.trim() ?? ''

  // Blocked dates for calendar: ?mode=blocks&barberId=&from=&to=
  if (mode === 'blocks') {
    if (!barberId || !findBarber(barberId)) {
      return NextResponse.json({ success: false, error: 'Некорректный barberId' }, { status: 400 })
    }

    const today = startOfDay(new Date())
    const from = searchParams.get('from')?.trim() || toISODate(today)
    const to = searchParams.get('to')?.trim() || toISODate(bookingMaxDate(today))

    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный диапазон дат (ожидается YYYY-MM-DD)' },
        { status: 400 },
      )
    }

    try {
      const { fullyBlockedDates } = await getBlockedDatesForBarber(barberId, from, to)
      return NextResponse.json({ success: true, fullyBlockedDates })
    } catch (err) {
      console.error('GET /api/bookings?mode=blocks', err)
      return NextResponse.json(
        { success: false, error: 'Не удалось загрузить блокировки. Проверьте DATABASE_URL.' },
        { status: 500 },
      )
    }
  }

  // Occupancy mode: ?barberId=&date=
  if (barberId || date) {
    if (!barberId || !findBarber(barberId)) {
      return NextResponse.json({ success: false, error: 'Некорректный barberId' }, { status: 400 })
    }
    if (!DATE_RE.test(date)) {
      return NextResponse.json({ success: false, error: 'Некорректная date (ожидается YYYY-MM-DD)' }, { status: 400 })
    }

    try {
      const occupancy = await getBusyForBarberDate(barberId, date)
      return NextResponse.json({
        success: true,
        bookings: occupancy.busyWithBlocks,
        dayBlocked: occupancy.dayBlocked,
      })
    } catch (err) {
      console.error('GET /api/bookings', err)
      return NextResponse.json(
        { success: false, error: 'Не удалось загрузить занятость. Проверьте DATABASE_URL.' },
        { status: 500 },
      )
    }
  }

  // List mode (public table — no name/phone/id)
  try {
    const list = await listPublicBookings()
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

  const parsed = validateBookingPayload(json)
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 })
  }

  try {
    const result = await createBookingRecord(parsed.data, { requireTelegram: true })
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status })
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
