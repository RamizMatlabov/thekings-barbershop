import { cn } from '@/lib/utils'

type LogoProps = {
  size?: 'sm' | 'lg'
  className?: string
}

const sizes = {
  sm: { box: 'h-11 w-9', title: 'text-xl', sub: 'text-[8px]' },
  lg: { box: 'h-15 w-12', title: 'text-2xl md:text-3xl', sub: 'text-[9px]' },
}

export function Logo({ size = 'sm', className }: LogoProps) {
  const s = sizes[size]
  return (
    <a href="#home" className={cn('group flex items-center gap-3', className)} aria-label="The King's Barbershop — на главную">
      <img
        src="/images/logo-emblem.png"
        alt=""
        aria-hidden="true"
        className={cn(s.box, 'shrink-0 object-contain transition-transform duration-500 group-hover:-translate-y-0.5')}
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
