'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/ui/styles/cn'

interface FabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'surface' | 'gold'
  size?: 'md' | 'lg'
  badge?: string | number
  label?: string
}

export const FabButton = forwardRef<HTMLButtonElement, FabButtonProps>(
  ({ className, variant = 'surface', size = 'md', badge, label, children, ...props }, ref) => {
    const dim = size === 'lg' ? 'w-20 h-20' : 'w-14 h-14'

    const styles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'linear-gradient(to bottom, #00d2ff, #00a8ff)',
        boxShadow: '0 6px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 3px 0 rgba(255,255,255,0.3), 0 0 20px rgba(0,168,255,0.45)',
        border: '2px solid rgba(255,255,255,0.35)',
        color: '#fff',
      },
      gold: {
        background: 'linear-gradient(to bottom, #ffd426, #ff9500)',
        boxShadow: '0 6px 0 rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 3px 0 rgba(255,255,255,0.3)',
        border: '2px solid rgba(255,255,255,0.4)',
        color: '#fff',
      },
      surface: {
        background: '#ffffff',
        boxShadow: '0 6px 0 rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.3)',
        border: '1px solid rgba(0,0,0,0.06)',
        color: '#0f172a',
      },
    }

    return (
      <div className="relative shrink-0 group">
        <button
          ref={ref}
          aria-label={label}
          className={cn(
            dim,
            'rounded-full flex items-center justify-center',
            'transition-all duration-100 active:translate-y-1 active:scale-95',
            'select-none backdrop-blur-sm overflow-hidden',
            className,
          )}
          style={styles[variant]}
          {...props}
        >
          {/* Gloss highlight */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.22) 0%, transparent 55%)' }}
          />
          <span className="relative z-10">{children}</span>
        </button>

        {/* Badge */}
        {badge !== undefined && badge !== 0 && (
          <div
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-black"
            style={{
              background: '#f9bd22',
              color: '#0f172a',
              fontFamily: 'var(--font-exo2), sans-serif',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {badge}
          </div>
        )}

        {/* Hover label tooltip */}
        {label && (
          <div
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'var(--font-exo2), sans-serif',
              backdropFilter: 'blur(8px)',
            }}
          >
            {label}
          </div>
        )}
      </div>
    )
  },
)

FabButton.displayName = 'FabButton'
