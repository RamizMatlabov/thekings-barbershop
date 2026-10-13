import { randomUUID } from 'crypto'
import { and, asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { isAdminAuthenticated, unauthorizedJson } from '@/lib/admin-auth'
import { DATE_RE, findBarber } from '@/lib/booking'
import { blocksOverlap, isValidBlockRange } from '@/lib/availability'
import { isNonEmptyString } from '@/lib/booking-service'
import { getDb } from '@/lib/db'
import { availabilityBlocks } from '@/lib/db/schema'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedJson()
  }

  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(availabilityBlocks)
      .orderBy(asc(availabilityBlocks.date), asc(availabilityBlocks.createdAt))

    const list = rows.map((row) => {
      const barber = findBarber(row.barberId)
      return {
        id: row.id,
        barberId: row.barberId,
        barberName: barber?.name ?? row.barberId,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        reason: row.reason,
        createdAt: row.createdAt.toISOString(),
        fullDay: row.startTime == null && row.endTime == null,
      }
    })

    return NextResponse.json({ success: true, blocks: list })
  } catch (err) {
    console.error('GET /api/admin/availability', err)
    return NextResponse.json(
      { success: false, error: 'Не удалось загрузить блокировки' },
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

  if (!json || typeof json !== 'object') {
    return NextResponse.json({ success: false, error: 'Некорректное тело запроса' }, { status: 400 })
  }

  const body = json as Record<string, unknown>
  if (!isNonEmptyString(body.barberId)) {
    return NextResponse.json({ success: false, error: 'Поле «barberId» обязательно' }, { status: 400 })
  }
  if (!isNonEmptyString(body.date) || !DATE_RE.test(body.date.trim())) {
    return NextResponse.json({ success: false, error: 'Некорректная дата' }, { status: 400 })
  }

  const barberId = body.barberId.trim()
  if (!findBarber(barberId)) {
    return NextResponse.json({ success: false, error: 'Неизвестный барбер' }, { status: 400 })
  }

  const date = body.date.trim()
  const fullDay = Boolean(body.fullDay)
  const startTime =
    fullDay || body.startTime == null || body.startTime === ''
      ? null
      : String(body.startTime).trim()
  const endTime =
    fullDay || body.endTime == null || body.endTime === '' ? null : String(body.endTime).trim()
  const reason =
    typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : null

  if (!isValidBlockRange(startTime, endTime)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Укажите полный день или корректный диапазон времени (начало раньше конца)',
      },
      { status: 400 },
    )
  }

  try {
    const db = getDb()
    const existing = await db
      .select({
        startTime: availabilityBlocks.startTime,
        endTime: availabilityBlocks.endTime,
      })
      .from(availabilityBlocks)
      .where(and(eq(availabilityBlocks.barberId, barberId), eq(availabilityBlocks.date, date)))

    const candidate = { startTime, endTime }
    const conflict = existing.some((row) => blocksOverlap(candidate, row))
    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Барбер уже заблокирован на эту дату/пересекающийся интервал',
        },
        { status: 409 },
      )
    }

    const id = randomUUID()
    await db.insert(availabilityBlocks).values({
      id,
      barberId,
      date,
      startTime,
      endTime,
      reason,
    })

    return NextResponse.json({ success: true, id })
  } catch (err) {
    console.error('POST /api/admin/availability', err)
    return NextResponse.json(
      { success: false, error: 'Не удалось создать блокировку' },
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
    return NextResponse.json({ success: false, error: 'Укажите id блокировки' }, { status: 400 })
  }

  try {
    const db = getDb()
    const deleted = await db
      .delete(availabilityBlocks)
      .where(eq(availabilityBlocks.id, id))
      .returning({ id: availabilityBlocks.id })

    if (deleted.length === 0) {
      return NextResponse.json({ success: false, error: 'Блокировка не найдена' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/availability', err)
    return NextResponse.json(
      { success: false, error: 'Не удалось удалить блокировку' },
      { status: 500 },
    )
  }
}
