import { NextResponse } from 'next/server'
import { isAdminAuthenticated, unauthorizedJson } from '@/lib/admin-auth'
import {
  createBookingRecord,
  deleteBooking,
  listAdminBookings,
  validateBookingPayload,
} from '@/lib/booking-service'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedJson()
  }

  try {
    const list = await listAdminBookings()
    return NextResponse.json({ success: true, bookings: list })
  } catch (err) {
    console.error('GET /api/admin/bookings', err)
    return NextResponse.json(
      { success: false, error: 'Не удалось загрузить записи' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedJson()
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Некорректный JSON' }, { status: 400 })
  }

  const parsed = validateBookingPayload(json, { relaxDateHorizon: true })
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 })
  }

  try {
    const result = await createBookingRecord(parsed.data, { requireTelegram: false })
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status })
    }
    return NextResponse.json({
      success: true,
      id: result.id,
      telegramOk: result.telegramOk,
      warning: result.telegramError,
    })
  } catch (err) {
    console.error('POST /api/admin/bookings', err)
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения записи' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedJson()
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')?.trim() ?? ''

  if (!id) {
    return NextResponse.json({ success: false, error: 'Укажите id записи' }, { status: 400 })
  }

  try {
    const deleted = await deleteBooking(id)
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Запись не найдена' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/bookings', err)
    return NextResponse.json(
      { success: false, error: 'Не удалось удалить запись' },
      { status: 500 },
    )
  }
}
