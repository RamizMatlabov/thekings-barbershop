'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Reveal, useInView } from './reveal'
import { SectionHeading } from './section-heading'

const stats = [
  { value: 5, suffix: '+', label: ['Лет', 'опыта'] },
  { value: 1000, suffix: '+', label: ['Довольных', 'клиентов'] },
  { value: 7, suffix: '', label: ['Дней', 'в неделю'] },
]

function CountUp({ to, suffix, start }: { to: number; suffix: string; start: boolean }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    const duration = 1600
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, to])

  return (
    <>
      {value}
      {suffix}
    </>
  )
}

export function About() {
  const { ref, inView } = useInView<HTMLDListElement>(0.4)

  return (
    <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <Reveal className="group relative">
          <div className="absolute -inset-3 border border-primary/30 transition-all duration-700 group-hover:-inset-4" aria-hidden="true" />
          <div className="relative aspect-[4/3] overflow-hidden border border-primary/50">
            <Image
              src="/images/about.png"
              alt="Интерьер The King's Barbershop с кожаным креслом барбера"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-[1.5s] group-hover:scale-105"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <SectionHeading>
              Не просто
              <br />
              стрижка
            </SectionHeading>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-6 max-w-md leading-relaxed text-foreground/80">
              {"The King's Barbershop — это место, где точность встречается с мастерством. "}
              Мы создаём стиль, который подчёркивает вашу индивидуальность и уверенность.
            </p>
          </Reveal>

          <dl ref={ref} className="mt-10 grid grid-cols-3 divide-x divide-border">
            {stats.map((stat) => (
              <div key={stat.label.join(' ')} className="flex flex-col-reverse px-3 first:pl-0 md:px-6">
                <dt className="mt-3 text-[11px] uppercase leading-snug tracking-[0.15em] text-muted-foreground">
                  {stat.label[0]}
                  <br />
                  {stat.label[1]}
                </dt>
                <dd className="font-serif text-4xl text-[#e2cfa9] md:text-5xl">
                  <CountUp to={stat.value} suffix={stat.suffix} start={inView} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
