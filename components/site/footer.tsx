import { navLinks } from '@/lib/data'
import { Logo } from './logo'
import { InstagramIcon, TelegramIcon } from './social-icons'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-5 py-10 md:px-8 lg:flex-row lg:justify-between">
        <Logo size="lg" />
        <nav aria-label="Навигация в подвале">
          <ul className="flex flex-wrap justify-center gap-x-7 gap-y-3">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-xs uppercase tracking-[0.18em] text-foreground/80 transition-colors hover:text-primary">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex gap-3">
          {[
            { href: 'https://instagram.com/the_kings_barbershop', label: 'Instagram', Icon: InstagramIcon },
            { href: 'https://t.me/the_kings_barbershop', label: 'Telegram', Icon: TelegramIcon },
          ].map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="flex size-11 items-center justify-center rounded-full border border-foreground/40 text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:text-primary"
            >
              <Icon className="size-5" />
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-center md:flex-row md:px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Стиль. Качество. Уверенность.</p>
          <p className="text-xs text-muted-foreground">
            {"© "}
            {new Date().getFullYear()}
            {" The King's Barbershop. Все права защищены."}
          </p>
        </div>
      </div>
    </footer>
  )
}
