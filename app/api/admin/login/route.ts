import { NextResponse } from 'next/server'
import {
  createSessionToken,
  isAdminPasswordConfigured,
  setAdminSessionCookie,
  verifyAdminPassword,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { success: false, error: 'ADMIN_PASSWORD не задан в окружении' },
      { status: 500 },
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Некорректный JSON' }, { status: 400 })
  }

  const password =
    json && typeof json === 'object' && typeof (json as { password?: unknown }).password === 'string'
      ? (json as { password: string }).password
      : ''

  if (!password || !verifyAdminPassword(password)) {
    return NextResponse.json({ success: false, error: 'Неверный пароль' }, { status: 401 })
  }

  const token = createSessionToken()
  if (!token) {
    return NextResponse.json({ success: false, error: 'Не удалось создать сессию' }, { status: 500 })
  }

  const response = NextResponse.json({ success: true })
  setAdminSessionCookie(response, token)
  return response
}
