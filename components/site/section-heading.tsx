import { cn } from '@/lib/utils'

export function SectionHeading({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <h2
      id={id}
      className={cn(
        'font-serif text-3xl font-medium uppercase tracking-[0.12em] text-[#e9e1d3] text-balance md:text-4xl',
        className,
      )}
    >
      {children}
    </h2>
  )
}
