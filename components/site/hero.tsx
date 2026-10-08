import Image from 'next/image'
import { ArrowDown } from 'lucide-react'

export function Hero() {
  return (
    <section id="home" className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-kb object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        <div className="animate-flicker pointer-events-none absolute left-1/2 top-24 size-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl md:left-[60%]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-24 md:px-8">
        <h1 className="font-serif text-5xl font-medium uppercase leading-[1.02] tracking-[0.04em] text-[#e2cfa9] md:text-7xl lg:text-8xl">
          <span className="animate-fade-up block" style={{ animationDelay: '150ms' }}>
            Ваш стиль.
          </span>
          <span className="animate-fade-up block" style={{ animationDelay: '350ms' }}>
            Ваш стандарт.
          </span>
        </h1>
        <p
          className="animate-fade-up mt-6 max-w-sm text-lg leading-relaxed text-foreground/85"
          style={{ animationDelay: '600ms' }}
        >
          Премиум-уход для мужчин, которые знают себе цену.
        </p>
        <div className="animate-fade-up mt-10 flex flex-wrap gap-4" style={{ animationDelay: '800ms' }}>
          <a
            href="#booking"
            className="bg-primary px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#dbb987] hover:shadow-[0_10px_30px_-10px_rgba(201,164,108,0.6)]"
          >
            Записаться
          </a>
          <a
            href="#services"
            className="border border-foreground/40 px-8 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
          >
            Наши услуги
          </a>
        </div>
      </div>

      <a
        href="#about"
        aria-label="Прокрутить вниз"
        className="absolute bottom-10 left-1/2 flex size-11 -translate-x-1/2 animate-bounce items-center justify-center rounded-full border border-foreground/40 text-foreground/80 transition-colors hover:border-primary hover:text-primary"
      >
        <ArrowDown className="size-4" />
      </a>
    </section>
  )
}
