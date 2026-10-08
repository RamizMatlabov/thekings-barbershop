'use client'

import Image from 'next/image'
import { useState } from 'react'
import { formatPrice, SELECT_SERVICE_EVENT, services } from '@/lib/data'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

export function selectService(id: string) {
  window.dispatchEvent(new CustomEvent(SELECT_SERVICE_EVENT, { detail: id }))
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })
}

export function Services() {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? services : services.slice(0, 5)

  return (
    <section id="services" className="scroll-mt-20 border-y border-border/60 bg-card/40 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <SectionHeading>Наши услуги</SectionHeading>
          </Reveal>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="border border-primary/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {showAll ? 'Свернуть' : 'Смотреть все'}
          </button>
        </div>

        <ul className={`mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 ${showAll ? 'lg:grid-cols-3' : 'lg:grid-cols-5'}`}>
          {visible.map((service, i) => (
            <Reveal as="li" key={service.id} delay={i * 90} className="h-full">
              <article className="group flex h-full flex-col border border-border bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-[0_20px_40px_-20px_rgba(201,164,108,0.35)]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={service.image || '/placeholder.svg'}
                    alt={service.title}
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                </div>
                <div className="flex flex-1 flex-col items-center px-4 pb-5 pt-4 text-center">
                  <h3 className="flex min-h-[2.5em] items-center font-serif text-lg font-medium uppercase leading-tight tracking-[0.1em] text-[#e9e1d3]">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm text-primary">{formatPrice(service)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{service.duration} мин</p>
                  <div className="mt-auto w-full pt-4">
                    <button
                      type="button"
                      onClick={() => selectService(service.id)}
                      className="w-full border border-primary/50 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
                    >
                      Записаться
                    </button>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
