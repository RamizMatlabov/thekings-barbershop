import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: "The King's Barbershop — премиум-барбершоп в Самарканде",
  description:
    "The King's Barbershop — премиум-уход для мужчин: стрижки, оформление бороды, классическое бритьё. Онлайн-запись к лучшим барберам Самарканда.",
  generator: 'v0.app',
  icons: {
    icon: '/images/logo-emblem.png',
    apple: '/images/logo-emblem.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0a09',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${cormorant.variable} ${manrope.variable} bg-background`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
