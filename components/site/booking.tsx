'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { barbers, formatPrice, SELECT_SERVICE_EVENT, services } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const steps = ['Услуга', 'Барбер', 'Дата', 'Время', 'Контакты', 'Подтверждение']

const timeSlots = Array.from({ length: 26 }, (_, i) => {
  const minutes = 9 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

function buildDates() {
  const today = new Date()
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })
}

function isSlotBusy(dateIndex: number, slotIndex: number, barberIndex: number) {
  return (dateIndex * 7 + slotIndex * 3 + barberIndex * 5) % 9 === 0
}

const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
const longDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

const primaryBtn =
  'bg-primary px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-all hover:bg-[#dbb987] disabled:cursor-not-allowed disabled:opacity-40'
const outlineBtn =
  'border border-primary/50 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:border-primary hover:text-primary'

export function Booking() {
  const [step, setStep] = useState(0)
  const [serviceId, setServiceId] = useState<string>(services[0].id)
  const [barberId, setBarberId] = useState<string | null>(null)
  const [dateIndex, setDateIndex] = useState<number | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('+998 ')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const dates = useMemo(buildDates, [])

  useEffect(() => {
    const onSelect = (e: Event) => {
      const id = (e as CustomEvent<string>).detail
      setServiceId(id)
      setStep(0)
      setSubmitted(false)
      setSubmitError(null)
    }
    window.addEventListener(SELECT_SERVICE_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_SERVICE_EVENT, onSelect)
  }, [])

  const service = services.find((s) => s.id === serviceId)!
  const barberIndex = barbers.findIndex((b) => b.id === barberId)
  const barber = barbers[barberIndex]
  const phoneValid = phone.replace(/\D/g, '').length >= 12

  const canContinue = [
    Boolean(serviceId),
    Boolean(barberId),
    dateIndex !== null,
    Boolean(time),
    name.trim().length >= 2 && phoneValid,
  ][step]

  function next() {
    setSubmitError(null)
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  async function confirmBooking() {
    if (!barber || dateIndex === null || !time || submitting) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          serviceTitle: service.title,
          barberId: barber.id,
          barberName: barber.name,
          date: longDate.format(dates[dateIndex]),
          time,
          name: name.trim(),
          phone: phone.trim(),
          duration: service.duration,
          price: service.price,
        }),
      })

      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null

      if (!res.ok || !data?.success) {
        setSubmitError(data?.error || 'Не удалось отправить запись. Попробуйте ещё раз.')
        return
      }

      setSubmitted(true)
      setStep(5)
    } catch {
      setSubmitError('Ошибка сети. Проверьте подключение и попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep(0)
    setBarberId(null)
    setDateIndex(null)
    setTime(null)
    setName('')
    setPhone('+998 ')
    setSubmitted(false)
    setSubmitting(false)
    setSubmitError(null)
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
            <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
              <fieldset>
                <legend className="mb-5 text-xs uppercase tracking-[0.2em] text-foreground/80">Выберите услугу</legend>
                <div className="divide-y divide-border border border-border bg-card">
                  {services.map((s) => (
                    <label
                      key={s.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-4 px-4 py-4 text-sm transition-colors hover:bg-accent',
                        serviceId === s.id && 'bg-accent',
                      )}
                    >
                      <input
                        type="radio"
                        name="service"
                        value={s.id}
                        checked={serviceId === s.id}
                        onChange={() => setServiceId(s.id)}
                        className="size-4 accent-[#c9a46c]"
                      />
                      <span className="flex-1">{s.title}</span>
                      <span className="text-primary">{formatPrice(s)}</span>
                      <span className="w-14 text-right text-xs text-muted-foreground">{s.duration} мин</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="relative hidden min-h-72 overflow-hidden border border-border md:block">
                <Image
                  key={service.image}
                  src={service.image || '/placeholder.svg'}
                  alt={service.title}
                  fill
                  sizes="40vw"
                  className="animate-in fade-in zoom-in-105 object-cover duration-700"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="mb-5 text-xs uppercase tracking-[0.2em] text-foreground/80">Выберите барбера</legend>
              <div className="mx-auto grid max-w-xl grid-cols-2 gap-4">
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBarberId(b.id)}
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

          {step === 2 && (
            <fieldset>
              <legend className="mb-5 text-xs uppercase tracking-[0.2em] text-foreground/80">Выберите дату</legend>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
                {dates.map((d, i) => (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => {
                      setDateIndex(i)
                      setTime(null)
                    }}
                    aria-pressed={dateIndex === i}
                    className={cn(
                      'flex flex-col items-center border py-3 transition-all duration-300 hover:border-primary/60',
                      dateIndex === i ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
                    )}
                  >
                    <span className={cn('text-[10px] uppercase tracking-[0.15em]', dateIndex === i ? '' : 'text-muted-foreground')}>
                      {weekday.format(d)}
                    </span>
                    <span className="mt-1 font-serif text-2xl">{d.getDate()}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 3 && dateIndex !== null && (
            <fieldset>
              <legend className="mb-5 text-xs uppercase tracking-[0.2em] text-foreground/80">
                Выберите время — {longDate.format(dates[dateIndex])}
              </legend>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-8">
                {timeSlots.map((slot, i) => {
                  const busy = isSlotBusy(dateIndex, i, barberIndex)
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

          {step === 5 && submitted && barber && dateIndex !== null && (
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
                  ['Услуга', service.title],
                  ['Барбер', barber.name],
                  ['Дата', longDate.format(dates[dateIndex])],
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
      </div>
    </section>
  )
}
