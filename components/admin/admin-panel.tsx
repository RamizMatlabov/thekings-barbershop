'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { buildTimeSlots, formatDateRu } from '@/lib/booking'
import { barbers, formatPrice, getServicesForBarber, services } from '@/lib/data'
import { cn } from '@/lib/utils'

type AdminBooking = {
  id: string
  serviceId: string
  barberId: string
  date: string
  startTime: string
  durationMinutes: number
  name: string
  phone: string
  serviceTitle: string
  barberName: string
  price: number
  priceMax?: number
  priceFrom: boolean
  createdAt: string
}

type AdminBlock = {
  id: string
  barberId: string
  barberName: string
  date: string
  startTime: string | null
  endTime: string | null
  reason: string | null
  createdAt: string
  fullDay: boolean
}

const timeSlots = buildTimeSlots()

const fieldClass =
  'w-full border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary'
const primaryBtn =
  'bg-primary px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-[#dbb987] disabled:cursor-not-allowed disabled:opacity-40'
const dangerBtn =
  'border border-destructive/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40'
const outlineBtn =
  'border border-primary/50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary'

export function AdminPanel() {
  const [authChecking, setAuthChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)

  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [blocks, setBlocks] = useState<AdminBlock[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [createForm, setCreateForm] = useState({
    barberId: barbers[0]?.id ?? '',
    serviceId: services[0]?.id ?? '',
    date: '',
    time: timeSlots[0] ?? '09:00',
    name: '',
    phone: '+998 ',
  })
  const [creating, setCreating] = useState(false)

  const [blockForm, setBlockForm] = useState({
    barberId: barbers[0]?.id ?? '',
    date: '',
    fullDay: true,
    startTime: '09:00',
    endTime: '13:00',
    reason: '',
  })
  const [blocking, setBlocking] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoadingData(true)
    setDataError(null)
    try {
      const [bookingsRes, blocksRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/availability'),
      ])

      if (bookingsRes.status === 401 || blocksRes.status === 401) {
        setAuthenticated(false)
        return
      }

      const bookingsData = (await bookingsRes.json().catch(() => null)) as
        | { success?: boolean; bookings?: AdminBooking[]; error?: string }
        | null
      const blocksData = (await blocksRes.json().catch(() => null)) as
        | { success?: boolean; blocks?: AdminBlock[]; error?: string }
        | null

      if (!bookingsRes.ok || !bookingsData?.success) {
        setDataError(bookingsData?.error || 'Не удалось загрузить записи')
        return
      }
      if (!blocksRes.ok || !blocksData?.success) {
        setDataError(blocksData?.error || 'Не удалось загрузить блокировки')
        return
      }

      setBookings(bookingsData.bookings ?? [])
      setBlocks(blocksData.blocks ?? [])
    } catch {
      setDataError('Ошибка сети при загрузке данных')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/me')
        if (cancelled) return
        if (res.ok) {
          setAuthenticated(true)
        } else {
          setAuthenticated(false)
        }
      } catch {
        if (!cancelled) setAuthenticated(false)
      } finally {
        if (!cancelled) setAuthChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (authenticated) void loadData()
  }, [authenticated, loadData])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null
      if (!res.ok || !data?.success) {
        setLoginError(data?.error || 'Не удалось войти')
        return
      }
      setPassword('')
      setAuthenticated(true)
    } catch {
      setLoginError('Ошибка сети')
    } finally {
      setLoggingIn(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthenticated(false)
    setBookings([])
    setBlocks([])
  }

  async function handleCreateBooking(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    setActionError(null)
    setActionMessage(null)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = (await res.json().catch(() => null)) as {
        success?: boolean
        error?: string
        warning?: string
      } | null
      if (!res.ok || !data?.success) {
        setActionError(data?.error || 'Не удалось создать запись')
        return
      }
      setActionMessage(data.warning || 'Тестовая запись создана')
      setCreateForm((prev) => ({ ...prev, name: '', phone: '+998 ' }))
      await loadData()
    } catch {
      setActionError('Ошибка сети при создании записи')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteBooking(id: string) {
    if (!confirm('Удалить эту запись?')) return
    setDeletingId(id)
    setActionError(null)
    setActionMessage(null)
    try {
      const res = await fetch(`/api/admin/bookings?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null
      if (!res.ok || !data?.success) {
        setActionError(data?.error || 'Не удалось удалить запись')
        return
      }
      setActionMessage('Запись удалена')
      await loadData()
    } catch {
      setActionError('Ошибка сети при удалении')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCreateBlock(e: FormEvent) {
    e.preventDefault()
    setBlocking(true)
    setActionError(null)
    setActionMessage(null)
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: blockForm.barberId,
          date: blockForm.date,
          fullDay: blockForm.fullDay,
          startTime: blockForm.fullDay ? null : blockForm.startTime,
          endTime: blockForm.fullDay ? null : blockForm.endTime,
          reason: blockForm.reason.trim() || null,
        }),
      })
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null
      if (!res.ok || !data?.success) {
        setActionError(data?.error || 'Не удалось создать блокировку')
        return
      }
      setActionMessage(
        blockForm.fullDay
          ? 'Барбер заблокирован на весь день'
          : `Интервал ${blockForm.startTime}–${blockForm.endTime} заблокирован`,
      )
      setBlockForm((prev) => ({ ...prev, reason: '' }))
      await loadData()
    } catch {
      setActionError('Ошибка сети при создании блокировки')
    } finally {
      setBlocking(false)
    }
  }

  async function handleDeleteBlock(id: string) {
    if (!confirm('Снять эту блокировку?')) return
    setDeletingId(id)
    setActionError(null)
    setActionMessage(null)
    try {
      const res = await fetch(`/api/admin/availability?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null
      if (!res.ok || !data?.success) {
        setActionError(data?.error || 'Не удалось снять блокировку')
        return
      }
      setActionMessage('Блокировка снята')
      await loadData()
    } catch {
      setActionError('Ошибка сети при удалении блокировки')
    } finally {
      setDeletingId(null)
    }
  }

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Проверка сессии…</p>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm border border-border bg-card/80 p-6 md:p-8"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary">The King&apos;s</p>
          <h1 className="mt-2 font-serif text-3xl uppercase tracking-[0.12em] text-[#e9e1d3]">Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Вход по паролю администратора</p>

          <label className="mt-8 grid gap-2 text-xs text-muted-foreground">
            Пароль
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              required
            />
          </label>

          {loginError && (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {loginError}
            </p>
          )}

          <button type="submit" disabled={loggingIn || !password} className={cn(primaryBtn, 'mt-6 w-full')}>
            {loggingIn ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="border-b border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary">The King&apos;s</p>
            <h1 className="font-serif text-2xl uppercase tracking-[0.12em] text-[#e9e1d3] md:text-3xl">
              Admin-панель
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => void loadData()} className={outlineBtn} disabled={loadingData}>
              Обновить
            </button>
            <button type="button" onClick={() => void handleLogout()} className={dangerBtn}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-10 px-5 pt-8 md:px-8">
        {(actionMessage || actionError || dataError) && (
          <div className="space-y-2">
            {actionMessage && (
              <p className="border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary" role="status">
                {actionMessage}
              </p>
            )}
            {(actionError || dataError) && (
              <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-400" role="alert">
                {actionError || dataError}
              </p>
            )}
          </div>
        )}

        {/* Create booking */}
        <section className="border border-border bg-card/50 p-5 md:p-6">
          <h2 className="font-serif text-xl uppercase tracking-[0.1em] text-[#e9e1d3]">Создать запись</h2>
          <p className="mt-1 text-sm text-muted-foreground">Тестовая или ручная запись клиента</p>

          <form onSubmit={handleCreateBooking} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs text-muted-foreground">
              Барбер
              <select
                value={createForm.barberId}
                onChange={(e) => {
                  const nextBarberId = e.target.value
                  const available = getServicesForBarber(nextBarberId)
                  setCreateForm((p) => ({
                    ...p,
                    barberId: nextBarberId,
                    serviceId: available.some((s) => s.id === p.serviceId)
                      ? p.serviceId
                      : (available[0]?.id ?? ''),
                  }))
                }}
                className={fieldClass}
                required
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs text-muted-foreground">
              Услуга
              <select
                value={createForm.serviceId}
                onChange={(e) => setCreateForm((p) => ({ ...p, serviceId: e.target.value }))}
                className={fieldClass}
                required
              >
                {getServicesForBarber(createForm.barberId).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({formatPrice(s)})
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs text-muted-foreground">
              Дата
              <input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
                className={fieldClass}
                required
              />
            </label>

            <label className="grid gap-2 text-xs text-muted-foreground">
              Время
              <select
                value={createForm.time}
                onChange={(e) => setCreateForm((p) => ({ ...p, time: e.target.value }))}
                className={fieldClass}
                required
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs text-muted-foreground">
              Имя
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                className={fieldClass}
                required
                minLength={2}
              />
            </label>

            <label className="grid gap-2 text-xs text-muted-foreground">
              Телефон
              <input
                type="tel"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, phone: e.target.value.replace(/[^\d+\s()-]/g, '') }))
                }
                className={fieldClass}
                required
              />
            </label>

            <div className="sm:col-span-2">
              <button type="submit" disabled={creating} className={primaryBtn}>
                {creating ? 'Создание…' : 'Создать запись'}
              </button>
            </div>
          </form>
        </section>

        {/* Availability */}
        <section className="border border-border bg-card/50 p-5 md:p-6">
          <h2 className="font-serif text-xl uppercase tracking-[0.1em] text-[#e9e1d3]">Доступность</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Отключить барбера на день или на интервал времени
          </p>

          <form onSubmit={handleCreateBlock} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs text-muted-foreground">
              Барбер
              <select
                value={blockForm.barberId}
                onChange={(e) => setBlockForm((p) => ({ ...p, barberId: e.target.value }))}
                className={fieldClass}
                required
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs text-muted-foreground">
              Дата
              <input
                type="date"
                value={blockForm.date}
                onChange={(e) => setBlockForm((p) => ({ ...p, date: e.target.value }))}
                className={fieldClass}
                required
              />
            </label>

            <label className="flex items-center gap-3 text-sm text-foreground sm:col-span-2">
              <input
                type="checkbox"
                checked={blockForm.fullDay}
                onChange={(e) => setBlockForm((p) => ({ ...p, fullDay: e.target.checked }))}
                className="size-4 accent-[#c9a46c]"
              />
              Весь день недоступен
            </label>

            {!blockForm.fullDay && (
              <>
                <label className="grid gap-2 text-xs text-muted-foreground">
                  С
                  <select
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm((p) => ({ ...p, startTime: e.target.value }))}
                    className={fieldClass}
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-xs text-muted-foreground">
                  До
                  <select
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm((p) => ({ ...p, endTime: e.target.value }))}
                    className={fieldClass}
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="21:45">21:45</option>
                  </select>
                </label>
              </>
            )}

            <label className="grid gap-2 text-xs text-muted-foreground sm:col-span-2">
              Причина (необязательно)
              <input
                value={blockForm.reason}
                onChange={(e) => setBlockForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Например: не придёт / до обеда"
                className={fieldClass}
              />
            </label>

            <div className="sm:col-span-2">
              <button type="submit" disabled={blocking} className={primaryBtn}>
                {blocking ? 'Сохранение…' : 'Добавить блокировку'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-xs uppercase tracking-[0.2em] text-foreground/80">Активные блокировки</h3>
            {loadingData && blocks.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Загрузка…</p>
            ) : blocks.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Нет блокировок</p>
            ) : (
              <ul className="mt-3 divide-y divide-border border border-border">
                {blocks.map((block) => (
                  <li
                    key={block.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-foreground">{block.barberName}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {formatDateRu(block.date)}
                        {' · '}
                        {block.fullDay ? 'весь день' : `${block.startTime}–${block.endTime}`}
                        {block.reason ? ` · ${block.reason}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={dangerBtn}
                      disabled={deletingId === block.id}
                      onClick={() => void handleDeleteBlock(block.id)}
                    >
                      Снять
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Bookings list */}
        <section className="border border-border bg-card/50 p-5 md:p-6">
          <h2 className="font-serif text-xl uppercase tracking-[0.1em] text-[#e9e1d3]">Все записи</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {loadingData ? 'Обновление…' : `${bookings.length} записей`}
          </p>

          {bookings.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Записей пока нет</p>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="mt-4 space-y-3 md:hidden">
                {bookings.map((b) => (
                  <li key={b.id} className="border border-border bg-background/40 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{b.name}</p>
                        <a href={`tel:${b.phone}`} className="text-primary">
                          {b.phone}
                        </a>
                      </div>
                      <button
                        type="button"
                        className={dangerBtn}
                        disabled={deletingId === b.id}
                        onClick={() => void handleDeleteBooking(b.id)}
                      >
                        Удалить
                      </button>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <dt className="uppercase tracking-[0.12em]">Дата</dt>
                        <dd className="mt-0.5 text-foreground">{formatDateRu(b.date)}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.12em]">Время</dt>
                        <dd className="mt-0.5 text-foreground">{b.startTime}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.12em]">Барбер</dt>
                        <dd className="mt-0.5 text-foreground">{b.barberName}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.12em]">Услуга</dt>
                        <dd className="mt-0.5 text-foreground">{b.serviceTitle}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="mt-4 hidden overflow-x-auto border border-border md:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-border bg-background/50 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium">Дата</th>
                      <th className="px-3 py-3 font-medium">Время</th>
                      <th className="px-3 py-3 font-medium">Барбер</th>
                      <th className="px-3 py-3 font-medium">Услуга</th>
                      <th className="px-3 py-3 font-medium">Клиент</th>
                      <th className="px-3 py-3 font-medium">Телефон</th>
                      <th className="px-3 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-accent/40">
                        <td className="px-3 py-3 whitespace-nowrap">{formatDateRu(b.date)}</td>
                        <td className="px-3 py-3">{b.startTime}</td>
                        <td className="px-3 py-3">{b.barberName}</td>
                        <td className="px-3 py-3">{b.serviceTitle}</td>
                        <td className="px-3 py-3">{b.name}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <a href={`tel:${b.phone}`} className="text-primary hover:underline">
                            {b.phone}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            className={dangerBtn}
                            disabled={deletingId === b.id}
                            onClick={() => void handleDeleteBooking(b.id)}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
