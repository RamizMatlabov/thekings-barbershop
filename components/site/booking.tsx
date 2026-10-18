'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  BOOKING_HORIZON_MONTHS,
  availableTimeSlotsForDate,
  buildTimeSlots,
  formatDateRu,
  isTimeSlotInPast,
  slotOverlapsBusy,
  startOfDay,
  summarizeServices,
  toISODate,
  type BusyInterval,
} from '@/lib/booking'
import { barbers, formatPrice, getServicesForBarber, SELECT_SERVICE_EVENT, services } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const steps = ['Барбер', 'Услуги', 'Дата', 'Время', 'Контакты', 'Подтверждение']

const timeSlots = buildTimeSlots()

const weekdayShort = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const monthTitle = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const longDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

type BookingListItem = {
  serviceId: string
  barberId: string
  date: string
  startTime: string
  durationMinutes: number
  serviceTitle: string
  barberName: string
  price: number
  priceMax?: number
  priceFrom: boolean
  createdAt: string
}

const primaryBtn =
  'bg-primary px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-all hover:bg-[#dbb987] disabled:cursor-not-allowed disabled:opacity-40'
const outlineBtn =
  'border border-primary/50 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:border-primary hover:text-primary'

function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function monthGrid(viewYear: number, viewMonth: number) {
  const first = new Date(viewYear, viewMonth, 1)
  // Monday-first: Sun=0 → 6
  const startPad = (first.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function Booking() {
  const today = useMemo(() => startOfDay(new Date()), [])
  const maxDate = useMemo(() => {
    const d = startOfDay(new Date())
    d.setMonth(d.getMonth() + BOOKING_HORIZON_MONTHS)
    return d
  }, [])

  const [step, setStep] = useState(0)
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [barberId, setBarberId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }))
  const [time, setTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+998 ')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [busyIntervals, setBusyIntervals] = useState<BusyInterval[]>([])
  const [busyLoading, setBusyLoading] = useState(false)
  const [busyError, setBusyError] = useState<string | null>(null)
  const [dayBlocked, setDayBlocked] = useState(false)
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [bookingList, setBookingList] = useState<BookingListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  async function loadBookingList() {
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch('/api/bookings')
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; bookings?: BookingListItem[]; error?: string }
        | null
      if (!res.ok || !data?.success || !Array.isArray(data.bookings)) {
        setBookingList([])
        setListError(data?.error || 'Не удалось загрузить записи')
        return
      }
      setBookingList(data.bookings)
    } catch {
      setBookingList([])
      setListError('Ошибка сети при загрузке записей')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    void loadBookingList()
  }, [])

  useEffect(() => {
    const onSelect = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      setSubmitted(false)
      setSubmitError(null)
      setBarberId((currentBarber) => {
        const available = getServicesForBarber(currentBarber)
        const offered = available.some((s) => s.id === id)
        if (currentBarber && offered) {
          setServiceIds([id])
          setStep(1)
          return currentBarber
        }
        setServiceIds([id])
        setStep(0)
        return null
      })
    }
    window.addEventListener(SELECT_SERVICE_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_SERVICE_EVENT, onSelect)
  }, [])

  useEffect(() => {
    if (!barberId || (step !== 2 && step !== 3)) return

    let cancelled = false
    const from = toISODate(today)
    const to = toISODate(maxDate)

    fetch(
      `/api/bookings?mode=blocks&barberId=${encodeURIComponent(barberId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    )
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | { success?: boolean; fullyBlockedDates?: string[]; error?: string }
          | null
        if (cancelled) return
        if (!res.ok || !data?.success || !Array.isArray(data.fullyBlockedDates)) {
          setBlockedDates(new Set())
          return
        }
        setBlockedDates(new Set(data.fullyBlockedDates))
      })
      .catch(() => {
        if (!cancelled) setBlockedDates(new Set())
      })

    return () => {
      cancelled = true
    }
  }, [barberId, step, today, maxDate])

  useEffect(() => {
    if (selectedDate && blockedDates.has(selectedDate)) {
      setSelectedDate(null)
      setTime(null)
    }
  }, [blockedDates, selectedDate])

  useEffect(() => {
    if (time && selectedDate && isTimeSlotInPast(selectedDate, time)) {
      setTime(null)
    }
  }, [time, selectedDate])

  useEffect(() => {
    if (step !== 3 || !barberId || !selectedDate) return

    let cancelled = false
    setBusyLoading(true)
    setBusyError(null)
    setDayBlocked(false)

    fetch(`/api/bookings?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(selectedDate)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | { success?: boolean; bookings?: BusyInterval[]; dayBlocked?: boolean; error?: string }
          | null
        if (cancelled) return
        if (!res.ok || !data?.success || !Array.isArray(data.bookings)) {
          setBusyIntervals([])
          setDayBlocked(false)
          setBusyError(data?.error || 'Не удалось загрузить занятость')
          return
        }
        setBusyIntervals(data.bookings)
        setDayBlocked(Boolean(data.dayBlocked))
      })
      .catch(() => {
        if (!cancelled) {
          setBusyIntervals([])
          setDayBlocked(false)
          setBusyError('Ошибка сети при загрузке слотов')
        }
      })
      .finally(() => {
        if (!cancelled) setBusyLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [step, barberId, selectedDate])

  const barberServices = useMemo(() => getServicesForBarber(barberId), [barberId])
  const selectedSummary = useMemo(() => summarizeServices(serviceIds, barberId), [serviceIds, barberId])
  const previewService = selectedSummary?.list[selectedSummary.list.length - 1] ?? barberServices[0] ?? services[0]
  const barber = barbers.find((b) => b.id === barberId)
  const phoneValid = phone.replace(/\D/g, '').length >= 12
  const selectedDateObj = selectedDate ? parseISODateLocal(selectedDate) : null
  const totalDuration = selectedSummary?.durationMinutes ?? 0
  const visibleTimeSlots = selectedDate ? availableTimeSlotsForDate(selectedDate) : timeSlots

  const canContinue = [
    Boolean(barberId),
    serviceIds.length > 0,
    Boolean(selectedDate),
    Boolean(time),
    name.trim().length >= 2 && phoneValid,
  ][step]

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
    setTime(null)
  }

  const minMonth = { year: today.getFullYear(), month: today.getMonth() }
  const maxMonth = { year: maxDate.getFullYear(), month: maxDate.getMonth() }
  const canPrevMonth =
    viewMonth.year > minMonth.year || (viewMonth.year === minMonth.year && viewMonth.month > minMonth.month)
  const canNextMonth =
    viewMonth.year < maxMonth.year || (viewMonth.year === maxMonth.year && viewMonth.month < maxMonth.month)

  const calendarCells = useMemo(
    () => monthGrid(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  )

  function selectDate(d: Date) {
    const iso = toISODate(d)
    setSelectedDate(iso)
    setTime(null)
  }

  function shiftMonth(delta: number) {
    setViewMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function isDayDisabled(d: Date) {
    const t = startOfDay(d).getTime()
    if (t < today.getTime() || t > maxDate.getTime()) return true
    return blockedDates.has(toISODate(d))
  }

  function next() {
    setSubmitError(null)
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  async function confirmBooking() {
    if (!barber || !selectedDate || !time || submitting) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceIds,
          barberId: barber.id,
          date: selectedDate,
          time,
          name: name.trim(),
          phone: phone.trim(),
        }),
      })

      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null

      if (!res.ok || !data?.success) {
        setSubmitError(data?.error || 'Не удалось отправить запись. Попробуйте ещё раз.')
        if (res.status === 409) {
          setTime(null)
          setStep(3)
        }
        return
      }

      setSubmitted(true)
      setStep(5)
      void loadBookingList()
    } catch {
      setSubmitError('Ошибка сети. Проверьте подключение и попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep(0)
    setServiceIds([])
    setBarberId(null)
    setSelectedDate(null)
    setViewMonth({ year: today.getFullYear(), month: today.getMonth() })
    setTime(null)
    setName('')
    setPhone('+998 ')
    setSubmitted(false)
    setSubmitting(false)
    setSubmitError(null)
    setBusyIntervals([])
    setBusyError(null)
    setDayBlocked(false)
    setBlockedDates(new Set())
  }

  return (
    <section id="booking" className="scroll-mt-20 border-y border-border/60 bg-card/40 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <Reveal>
          <SectionHeading className="text-center">Записаться на приём</SectionHeading>
        </Reveal>

        <Reveal delay={100}>
          <ol className="mt-12 flex items-start justify-between" aria-label="Шаги записи">
            {steps.map((label, i) => {
              const done = i < step
              const current = i === step
              return (
                <li key={label} className="relative flex flex-1 flex-col items-center">
                  {i > 0 && (
                    <span aria-hidden="true" className="absolute right-1/2 top-3.5 h-px w-full bg-border">
                      <span
                        className="block h-full origin-left bg-primary transition-transform duration-700"
                        style={{ transform: `scaleX(${i <= step ? 1 : 0})` }}
                      />
                    </span>
                  )}
                  <span
                    aria-current={current ? 'step' : undefined}
                    className={cn(
                      'relative z-10 flex size-7 items-center justify-center rounded-full border text-xs transition-all duration-500',
                      current && 'scale-110 border-primary bg-primary text-primary-foreground',
                      done && 'border-primary bg-background text-primary',
                      !current && !done && 'border-border bg-background text-muted-foreground',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      'mt-3 hidden text-[10px] uppercase tracking-[0.15em] sm:block',
                      current ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {label}
                  </span>
                </li>
              )
            })}
          </ol>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-primary sm:hidden">{steps[step]}</p>
        </Reveal>

        <div key={step} className="animate-in fade-in slide-in-from-bottom-4 mt-12 duration-500">
          {step === 0 && (
            <fieldset>
              <legend className="mb-5 text-xs uppercase tracking-[0.2em] text-foreground/80">Выберите барбера</legend>
              <div className="mx-auto grid max-w-xl grid-cols-2 gap-4">
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      const available = getServicesForBarber(b.id)
                      setBarberId(b.id)
                      setServiceIds((prev) => {
                        const kept = prev.filter((id) => available.some((s) => s.id === id))
                        return kept.length > 0 ? kept : available[0] ? [available[0].id] : []
                      })
                      setSelectedDate(null)
                      setTime(null)
                      setBlockedDates(new Set())
                    }}
                    aria-pressed={barberId === b.id}
                    className={cn(
                      'group overflow-hidden border bg-card text-center transition-all duration-300 hover:-translate-y-1',
                      barberId === b.id ? 'border-primary shadow-[0_0_0_1px_#c9a46c]' : 'border-border hover:border-primary/50',
                    )}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image
                        src={b.image || '/placeholder.svg'}
                        alt={`Барбер ${b.name}`}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-3 py-4">
                      <p className="font-serif text-lg uppercase tracking-[0.12em] text-[#e9e1d3]">{b.name}</p>
                      <p className="mt-1 text-xs text-primary">{b.role}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{b.experience}</p>
                    </div>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
              <fieldset>
                <legend className="mb-5 text-xs uppercase tracking-[0.2em] text-foreground/80">
                  Выберите услуги
                </legend>
                <p className="mb-4 text-xs text-muted-foreground">Можно выбрать несколько услуг сразу</p>
                <div className="divide-y divide-border border border-border bg-card">
                  {barberServices.map((s) => {
                    const checked = serviceIds.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-4 px-4 py-4 text-sm transition-colors hover:bg-accent',
                          checked && 'bg-accent',
                        )}
                      >
                        <input
                          type="checkbox"
                          name="service"
                          value={s.id}
                          checked={checked}
                          onChange={() => toggleService(s.id)}
                          className="size-4 accent-[#c9a46c]"
                        />
                        <span className="flex-1">{s.title}</span>
                        <span className="text-primary">{formatPrice(s)}</span>
                        <span className="w-14 text-right text-xs text-muted-foreground">{s.duration} мин</span>
                      </label>
                    )
                  })}
                </div>
                {selectedSummary && serviceIds.length > 0 && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Выбрано: {selectedSummary.title} · {selectedSummary.durationMinutes} мин ·{' '}
                    <span className="text-primary">{formatPrice(selectedSummary)}</span>
                  </p>
                )}
              </fieldset>
              <div className="relative hidden min-h-72 overflow-hidden border border-border md:block">
                <Image
                  key={previewService.image}
                  src={previewService.image || '/placeholder.svg'}
                  alt={previewService.title}
                  fill
                  sizes="40vw"
                  className="animate-in fade-in zoom-in-105 object-cover duration-700"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="mb-5 text-xs uppercase tracking-[0.2em] text-foreground/80">Выберите дату</legend>
              <div className="mx-auto max-w-md border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    disabled={!canPrevMonth}
                    className={cn(
                      'px-3 py-1 text-xs uppercase tracking-[0.2em] transition-colors',
                      canPrevMonth ? 'text-primary hover:text-[#dbb987]' : 'cursor-not-allowed text-muted-foreground/40',
                    )}
                    aria-label="Предыдущий месяц"
                  >
                    ←
                  </button>
                  <p className="font-serif text-lg capitalize tracking-[0.08em] text-[#e9e1d3]">
                    {monthTitle.format(new Date(viewMonth.year, viewMonth.month, 1))}
                  </p>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    disabled={!canNextMonth}
                    className={cn(
                      'px-3 py-1 text-xs uppercase tracking-[0.2em] transition-colors',
                      canNextMonth ? 'text-primary hover:text-[#dbb987]' : 'cursor-not-allowed text-muted-foreground/40',
                    )}
                    aria-label="Следующий месяц"
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-px border-b border-border bg-border/40">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="bg-card py-2 text-center text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-border/40 p-px">
                  {calendarCells.map((d, i) => {
                    if (!d) {
                      return <div key={`empty-${i}`} className="min-h-12 bg-card/60 sm:min-h-14" />
                    }
                    const iso = toISODate(d)
                    const disabled = isDayDisabled(d)
                    const selected = selectedDate === iso
                    const isToday = toISODate(today) === iso
                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectDate(d)}
                        aria-pressed={selected}
                        aria-label={`${weekdayShort.format(d)} ${longDate.format(d)}`}
                        className={cn(
                          'flex min-h-12 flex-col items-center justify-center bg-card transition-all duration-300 sm:min-h-14',
                          disabled && 'cursor-not-allowed text-muted-foreground/30',
                          !disabled && !selected && 'hover:bg-accent hover:text-primary',
                          selected && 'bg-primary text-primary-foreground',
                          !selected && isToday && !disabled && 'text-primary',
                        )}
                      >
                        <span className="font-serif text-xl leading-none">{d.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Доступны даты с сегодня до {longDate.format(maxDate)}
              </p>
            </fieldset>
          )}

          {step === 3 && selectedDateObj && (
            <fieldset>
              <legend className="mb-5 text-xs uppercase tracking-[0.2em] text-foreground/80">
                Выберите время — {longDate.format(selectedDateObj)}
              </legend>
              {busyLoading && (
                <p className="mb-4 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Загрузка свободных слотов…
                </p>
              )}
              {busyError && (
                <p className="mb-4 text-center text-sm text-red-400" role="alert">
                  {busyError}
                </p>
              )}
              {dayBlocked && !busyError && (
                <p className="mb-4 text-center text-sm text-muted-foreground" role="status">
                  Барбер недоступен в этот день
                </p>
              )}
              {!dayBlocked && !busyError && visibleTimeSlots.length === 0 && (
                <p className="mb-4 text-center text-sm text-muted-foreground" role="status">
                  На сегодня свободных слотов уже нет. Выберите другую дату.
                </p>
              )}
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-8">
                {visibleTimeSlots.map((slot) => {
                  const busy =
                    busyLoading ||
                    busyError != null ||
                    dayBlocked ||
                    slotOverlapsBusy(slot, totalDuration, busyIntervals)
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={busy}
                      onClick={() => setTime(slot)}
                      aria-pressed={time === slot}
                      className={cn(
                        'border py-2.5 text-sm transition-all duration-300',
                        busy && 'cursor-not-allowed border-border/40 text-muted-foreground/40 line-through',
                        !busy && time === slot && 'border-primary bg-primary text-primary-foreground',
                        !busy && time !== slot && 'border-border bg-card hover:border-primary/60',
                      )}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )}

          {step === 4 && (
            <form
              className="mx-auto grid max-w-md gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (canContinue) void confirmBooking()
              }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/80">Ваши контакты</p>
              <label className="grid gap-2 text-xs text-muted-foreground">
                Ваше имя
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
              </label>
              <label className="grid gap-2 text-xs text-muted-foreground">
                Телефон
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s()-]/g, ''))}
                  className="border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                />
              </label>
              <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
            </form>
          )}

          {step === 5 && submitted && barber && selectedDateObj && (
            <div className="flex flex-col items-center text-center">
              <span className="animate-in zoom-in-50 flex size-20 items-center justify-center rounded-full border border-primary duration-500">
                <svg viewBox="0 0 24 24" className="size-9 text-primary" fill="none" aria-hidden="true">
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-draw"
                  />
                </svg>
              </span>
              <h3 className="mt-6 font-serif text-2xl uppercase tracking-[0.12em] text-[#e2cfa9]">Ваша запись подтверждена!</h3>
              <p className="mt-2 text-sm text-muted-foreground">Спасибо! Ждём вас.</p>

              <dl className="mt-8 grid w-full grid-cols-2 border border-border bg-card text-center sm:grid-cols-5 sm:divide-x sm:divide-border">
                {[
                  ['Услуги', selectedSummary?.title ?? ''],
                  ['Барбер', barber.name],
                  ['Дата', longDate.format(selectedDateObj)],
                  ['Время', time],
                  ['Телефон', phone],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col-reverse gap-2 px-3 py-4">
                    <dd className="text-sm">{value}</dd>
                    <dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</dt>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a href="#home" onClick={reset} className={primaryBtn}>
                  На главную
                </a>
                <button type="button" onClick={reset} className={outlineBtn}>
                  Новая запись
                </button>
              </div>
            </div>
          )}
        </div>

        {step < 5 && (
          <div className="mt-10 flex flex-col gap-4">
            {submitError && (
              <p className="text-center text-sm text-red-400" role="alert">
                {submitError}
              </p>
            )}
            <div className="flex items-center justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSubmitError(null)
                    setStep((s) => s - 1)
                  }}
                  disabled={submitting}
                  className={outlineBtn}
                >
                  Назад
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => {
                  if (step === 4) void confirmBooking()
                  else next()
                }}
                disabled={!canContinue || submitting}
                className={primaryBtn}
              >
                {step === 4 ? (submitting ? 'Отправка…' : 'Подтвердить') : 'Далее'}
              </button>
            </div>
          </div>
        )}

        <Reveal delay={150}>
          <div className="mt-16 border-t border-border/60 pt-12">
            <h3 className="text-center text-xs uppercase tracking-[0.22em] text-foreground/80">Записи</h3>

            {listLoading && (
              <p className="mt-6 text-center text-xs uppercase tracking-[0.15em] text-muted-foreground">
                Загрузка записей…
              </p>
            )}

            {!listLoading && listError && (
              <p className="mt-6 text-center text-sm text-red-400" role="alert">
                {listError}
              </p>
            )}

            {!listLoading && !listError && bookingList.length === 0 && (
              <p className="mt-6 text-center text-sm text-muted-foreground">Пока нет записей</p>
            )}

            {!listLoading && !listError && bookingList.length > 0 && (
              <>
                {/* Desktop table */}
                <div className="mt-6 hidden overflow-x-auto border border-border bg-card md:block">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Услуга</th>
                        <th className="px-4 py-3 font-medium">Барбер</th>
                        <th className="px-4 py-3 font-medium">Дата</th>
                        <th className="px-4 py-3 font-medium">Время</th>
                        <th className="px-4 py-3 font-medium">Длительность</th>
                        <th className="px-4 py-3 font-medium">Цена</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bookingList.map((row) => (
                        <tr key={`${row.date}-${row.startTime}-${row.barberId}-${row.createdAt}`}>
                          <td className="px-4 py-3">{row.serviceTitle}</td>
                          <td className="px-4 py-3">{row.barberName}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatDateRu(row.date)}</td>
                          <td className="px-4 py-3">{row.startTime}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{row.durationMinutes} мин</td>
                          <td className="px-4 py-3 whitespace-nowrap text-primary">
                            {formatPrice({
                              price: row.price,
                              priceMax: row.priceMax,
                              priceFrom: row.priceFrom,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <ul className="mt-6 divide-y divide-border border border-border bg-card md:hidden">
                  {bookingList.map((row) => (
                    <li
                      key={`${row.date}-${row.startTime}-${row.barberId}-${row.createdAt}`}
                      className="grid gap-2 px-4 py-4"
                    >
                      <p className="text-sm">{row.serviceTitle}</p>
                      <p className="text-xs text-muted-foreground">{row.barberName}</p>
                      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                        <span>
                          {formatDateRu(row.date)} · {row.startTime} · {row.durationMinutes} мин
                        </span>
                        <span className="text-primary">
                          {formatPrice({
                            price: row.price,
                            priceMax: row.priceMax,
                            priceFrom: row.priceFrom,
                          })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
