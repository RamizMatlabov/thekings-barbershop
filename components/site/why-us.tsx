import { Armchair, Crown, Gem, Scissors } from 'lucide-react'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const reasons = [
  { icon: Scissors, title: ['Опытные', 'барберы'] },
  { icon: Crown, title: ['Премиум', 'сервис'] },
  { icon: Gem, title: ['Внимание', 'к деталям'] },
  { icon: Armchair, title: ['Уютная', 'атмосфера'] },
]

export function WhyUs() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
      <Reveal className="flex items-center gap-6">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <SectionHeading className="text-center">Почему выбирают нас</SectionHeading>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </Reveal>
      <ul className="mt-14 grid grid-cols-2 gap-y-10 md:grid-cols-4 md:divide-x md:divide-border">
        {reasons.map(({ icon: Icon, title }, i) => (
          <Reveal as="li" key={title.join(' ')} delay={i * 120} className="group flex flex-col items-center text-center">
            <span className="flex size-16 items-center justify-center rounded-full border border-primary/30 text-primary transition-all duration-500 group-hover:rotate-[8deg] group-hover:scale-110 group-hover:border-primary group-hover:bg-primary/10">
              <Icon className="size-7" strokeWidth={1.25} aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs uppercase leading-relaxed tracking-[0.2em] text-foreground/85">
              {title[0]}
              <br />
              {title[1]}
            </p>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
