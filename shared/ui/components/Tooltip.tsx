'use client'

/**
 * Tooltip de ayuda — se renderiza en un portal a `document.body` con
 * `position: fixed`, por lo que SIEMPRE queda por encima de todo (barra
 * superior, mapa, sheets, etc.). Esto evita el problema de stacking context
 * de `.glass-panel` (backdrop-filter crea un contexto propio y atrapaba el
 * `z-50` del tooltip por debajo del header sticky).
 *
 * Uso (mismo patrón que antes): colocarlo como hijo de un contenedor
 * `.relative.group` — el tooltip detecta su elemento padre como disparador
 * y muestra/oculta en hover/focus.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Align = 'left' | 'center' | 'right'
type Dir = 'up' | 'down'

export function Tooltip({ text, align = 'center', dir = 'up' }: { text: string; align?: Align; dir?: Dir }) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // Mostrar/ocultar según hover o focus del elemento padre (el disparador)
  useEffect(() => {
    const trigger = anchorRef.current?.parentElement
    if (!trigger) return

    const show = () => setRect(trigger.getBoundingClientRect())
    const hide = () => setRect(null)

    trigger.addEventListener('mouseenter', show)
    trigger.addEventListener('mouseleave', hide)
    trigger.addEventListener('focusin', show)
    trigger.addEventListener('focusout', hide)
    return () => {
      trigger.removeEventListener('mouseenter', show)
      trigger.removeEventListener('mouseleave', hide)
      trigger.removeEventListener('focusin', show)
      trigger.removeEventListener('focusout', hide)
    }
  }, [])

  // Reposicionar mientras está visible (scroll / resize)
  useEffect(() => {
    if (!rect) return
    const trigger = anchorRef.current?.parentElement
    if (!trigger) return
    const reposition = () => setRect(trigger.getBoundingClientRect())
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [rect])

  // Cálculo de posición fija a partir del rect del disparador
  let left = 0
  let tx = '-50%'
  if (rect) {
    if (align === 'left') { left = rect.left; tx = '0' }
    else if (align === 'right') { left = rect.right; tx = '-100%' }
    else { left = rect.left + rect.width / 2; tx = '-50%' }
  }
  const top = rect ? (dir === 'up' ? rect.top - 8 : rect.bottom + 8) : 0
  const ty = dir === 'up' ? '-100%' : '0'

  return (
    <>
      {/* Ancla invisible: sirve para localizar el elemento padre disparador */}
      <span ref={anchorRef} aria-hidden style={{ display: 'none' }} />
      {rect && typeof document !== 'undefined' && createPortal(
        <div
          role="tooltip"
          className="fixed whitespace-normal px-2.5 py-1.5 rounded-xl text-[11px] font-semibold leading-snug pointer-events-none"
          style={{
            top,
            left,
            maxWidth: '15rem',
            transform: `translate(${tx}, ${ty})`,
            zIndex: 2147483000,
            background: 'rgba(15,23,42,0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-exo2), sans-serif',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {text}
        </div>,
        document.body,
      )}
    </>
  )
}
