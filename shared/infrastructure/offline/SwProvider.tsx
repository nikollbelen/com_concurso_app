'use client'

import { SerwistProvider } from '@serwist/turbopack/react'
import type { ReactNode } from 'react'

export function SwProvider({ children }: { children: ReactNode }) {
  // Desactivamos el SW en desarrollo para evitar el bucle de recarga
  // que produce clientsClaim + skipWaiting al re-evaluar el SW.
  const disable = process.env.NODE_ENV === 'development'

  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={disable}>
      {children}
    </SerwistProvider>
  )
}
