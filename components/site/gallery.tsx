'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { galleryFilters, galleryItems } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

export function Gallery() {
  const [filter, setFilter] = useState<(typeof galleryFilters)[number]['id']>('all')
  const [lightbox, setLightbox] = useState<number | null>(null)

  const items = filter === 'all' ? galleryItems : galleryItems.filter((g) => g.category === filter)

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % items.length))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? i : (i - 1 + items.length) % items.length))
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightbox, items.length])

  return (
    <section id="gallery" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHeading className="text-center">Галерея</SectionHeading>
      </Reveal>

      <Reveal delay={100}>
        <div role="group" aria-label="Фильтр галереи" className="mt-8 flex flex-wrap justify-center gap-2">
          {galleryFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                'border px-5 py-2 text-xs transition-colors duration-300',
                filter === f.id
                  ? 'border-primary bg-[#e2cfa9] text-primary-foreground'
                  : 'border-border text-foreground/80 hover:border-primary/60 hover:text-primary',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      <ul className="mt-10 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4">
        {items.map((item, i) => (
          <li
            key={`${filter}-${item.src}`}
            className={cn(
              'animate-in fade-in zoom-in-95 fill-mode-both duration-500',
              i === 0 && items.length > 4 && 'md:row-span-2',
              i === 3 && items.length > 6 && 'md:row-span-2',
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <button
              type="button"
              onClick={() => setLightbox(i)}
              className="group relative block size-full overflow-hidden border border-border"
              aria-label={`Открыть фото: ${item.alt}`}
            >
              <Image
                src={item.src || '/placeholder.svg'}
                alt={item.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-background/0 transition-colors duration-500 group-hover:bg-background/30" />
              <span className="absolute inset-3 border border-primary/0 transition-all duration-500 group-hover:border-primary/60" />
            </button>
          </li>
        ))}
      </ul>

      {lightbox !== null && items[lightbox] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={items[lightbox].alt}
          className="animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm duration-300"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex size-11 items-center justify-center border border-border text-foreground hover:border-primary hover:text-primary"
            onClick={() => setLightbox(null)}
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Предыдущее фото"
            className="absolute left-4 flex size-11 items-center justify-center border border-border hover:border-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation()
              setLightbox((lightbox - 1 + items.length) % items.length)
            }}
          >
            <ChevronLeft className="size-5" />
          </button>
          <div
            key={lightbox}
            className="animate-in zoom-in-95 relative aspect-square w-full max-w-3xl duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={items[lightbox].src || '/placeholder.svg'} alt={items[lightbox].alt} fill sizes="90vw" className="object-contain" />
          </div>
          <button
            type="button"
            aria-label="Следующее фото"
            className="absolute right-4 flex size-11 items-center justify-center border border-border hover:border-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation()
              setLightbox((lightbox + 1) % items.length)
            }}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </section>
  )
}
