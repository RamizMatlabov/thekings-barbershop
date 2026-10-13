import { NextResponse } from 'next/server'
import { isAdminAuthenticated, unauthorizedJson } from '@/lib/admin-auth'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return unauthorizedJson()
  }
  return NextResponse.json({ success: true, authenticated: true })
}
