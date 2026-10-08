import { cn } from '@/lib/utils'

type LogoProps = {
  size?: 'sm' | 'lg'
  className?: string
}

const sizes = {
  sm: { box: 'h-12 w-9', bg: '99px', pos: '-31.5px -5px', title: 'text-xl', sub: 'text-[8px]' },
  lg: { box: 'h-16 w-11', bg: '133px', pos: '-44.8px -7.5px', title: 'text-2xl md:text-3xl', sub: 'text-[9px]' },
}

export function Logo({ size = 'sm', className }: LogoProps) {
  const s = sizes[size]
  return (
    <a href="#home" className={cn('group flex items-center gap-3', className)} aria-label="The King's Barbershop — на главную">
      <span
        aria-hidden="true"
        className={cn(s.box, 'shrink-0 bg-no-repeat mix-blend-lighten transition-transform duration-500 group-hover:-translate-y-0.5')}
        style={{
          backgroundImage: 'url(/images/logo.jpg)',
          backgroundSize: s.bg,
          backgroundPosition: s.pos,
          maskImage: 'radial-gradient(ellipse at center, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 60%, transparent 100%)',
        }}
      />
      <span className="flex flex-col items-center leading-none">
        <span className={cn(s.title, 'font-serif font-medium tracking-[0.12em] text-[#e9e1d3]')}>{"THE KING'S"}</span>
        <span className={cn(s.sub, 'mt-1 flex items-center gap-1.5 tracking-[0.35em] text-muted-foreground')}>
          <span className="h-px w-3 bg-muted-foreground/60" />
          BARBERSHOP
          <span className="h-px w-3 bg-muted-foreground/60" />
        </span>
      </span>
    </a>
  )
}
