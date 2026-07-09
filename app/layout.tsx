import type { Metadata } from 'next'
import { Cinzel_Decorative, Exo_2, Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/shared/infrastructure/providers/QueryProvider'
import { SwProvider } from '@/shared/infrastructure/offline/SwProvider'

/* Cinzel Decorative — RPG headings, level badges, chapter titles */
const cinzel = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel',
  display: 'swap',
})

/* Exo 2 — game UI: stats, numbers, labels, buttons */
const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-exo2',
  display: 'swap',
})

/* Inter — body text, descriptions */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Guardianes de Arequipa',
  description: 'Concurso inter-escolar de conocimientos sobre la Ciudad Blanca',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${cinzel.variable} ${exo2.variable} ${inter.variable} h-full`}
    >
      <body className="h-full" style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
        <SwProvider>
          <QueryProvider>{children}</QueryProvider>
        </SwProvider>
      </body>
    </html>
  )
}
