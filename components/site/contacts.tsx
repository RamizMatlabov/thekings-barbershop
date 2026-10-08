'use client'

import { useState } from 'react'
import { Clock, MapPin, Phone, Check } from 'lucide-react'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'
import { InstagramIcon, TelegramIcon } from './social-icons'

const info = [
  { icon: MapPin, label: 'Где мы находимся', value: ['Самарканд, Узбекистан'] },
  { icon: Clock, label: 'Режим работы', value: ['09:00 — 22:00', 'Каждый день'] },
  { icon: Phone, label: 'Телефон', value: ['+998 90 123 45 67'], href: 'tel:+998901234567' },
  { icon: InstagramIcon, label: 'Instagram', value: ['@the_kings_barbershop'], href: 'https://instagram.com/the_kings_barbershop' },
  { icon: TelegramIcon, label: 'Telegram', value: ['@the_kings_barbershop'], href: 'https://t.me/the_kings_barbershop' },
]

const inputClass =
  'w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary'

export function Contacts() {
  const [sent, setSent] = useState(false)

  return (
    <section id="contacts" className="scroll-mt-20 border-t border-border/60 bg-card/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal>
          <SectionHeading className="text-center">Контакты</SectionHeading>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1.6fr_1.1fr]">
          <Reveal>
            <address className="flex h-full flex-col gap-6 border border-border bg-card p-6 not-italic">
              {info.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex gap-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.5} />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                    {value.map((v) =>
                      href ? (
                        <a
                          key={v}
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                          className="mt-1 block text-sm transition-colors hover:text-primary"
                        >
                          {v}
                        </a>
                      ) : (
                        <p key={v} className="mt-1 text-sm">
                          {v}
                        </p>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </address>
          </Reveal>

          <Reveal delay={120} className="min-h-80 overflow-hidden border border-border">
            <iframe
              title="Карта: The King's Barbershop, Самарканд"
              src="https://www.google.com/maps?q=Samarkand,Uzbekistan&z=14&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="size-full min-h-80 [filter:grayscale(1)_invert(0.92)_contrast(0.9)_sepia(0.25)]"
            />
          </Reveal>

          <Reveal delay={240}>
            {sent ? (
              <div className="animate-in fade-in zoom-in-95 flex h-full flex-col items-center justify-center gap-4 border border-border bg-card p-6 text-center duration-500">
                <span className="flex size-14 items-center justify-center rounded-full border border-primary text-primary">
                  <Check className="size-6" />
                </span>
                <p className="font-serif text-xl uppercase tracking-[0.1em] text-[#e2cfa9]">Сообщение отправлено</p>
                <p className="text-sm text-muted-foreground">Мы свяжемся с вами в ближайшее время.</p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-2 text-xs uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
                >
                  Написать ещё
                </button>
              </div>
            ) : (
              <form
                className="flex h-full flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  setSent(true)
                }}
              >
                <label className="sr-only" htmlFor="c-name">Ваше имя</label>
                <input id="c-name" required placeholder="Ваше имя" autoComplete="name" className={inputClass} />
                <label className="sr-only" htmlFor="c-phone">Телефон</label>
                <input id="c-phone" required type="tel" placeholder="Телефон" autoComplete="tel" className={inputClass} />
                <label className="sr-only" htmlFor="c-ig">Instagram</label>
                <input id="c-ig" placeholder="Instagram (необязательно)" className={inputClass} />
                <label className="sr-only" htmlFor="c-msg">Сообщение</label>
                <textarea id="c-msg" rows={4} placeholder="Сообщение" className={`${inputClass} flex-1 resize-none`} />
                <button
                  type="submit"
                  className="bg-primary py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-[#dbb987]"
                >
                  Отправить
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
