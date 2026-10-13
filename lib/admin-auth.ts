import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'kb_admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!password) return null
  const extra = process.env.ADMIN_SESSION_SECRET?.trim()
  return extra ? `${password}:${extra}` : password
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim())
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim()
  if (!expected) return false
  return safeEqual(password, expected)
}

export function createSessionToken(): string | null {
  const secret = getSecret()
  if (!secret) return null
  const expiresAt = String(Date.now() + SESSION_TTL_MS)
  const sig = sign(expiresAt, secret)
  return `${expiresAt}.${sig}`
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const secret = getSecret()
  if (!secret) return false

  const [expiresAt, sig] = token.split('.')
  if (!expiresAt || !sig) return false

  const exp = Number(expiresAt)
  if (!Number.isFinite(exp) || Date.now() > exp) return false

  const expected = sign(expiresAt, secret)
  return safeEqual(sig, expected)
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies()
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value)
}

export function unauthorizedJson(message = 'Требуется авторизация') {
  return NextResponse.json({ success: false, error: message }, { status: 401 })
}
