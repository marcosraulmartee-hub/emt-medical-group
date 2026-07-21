interface LogoProps {
  variant?: 'mark' | 'full'
  negative?: boolean
  className?: string
}

const MARK_PATH =
  'M10,25 C10,14 18,6 30,6 C40,6 42,18 50,18 C58,18 60,6 70,6 C82,6 90,14 90,25 C90,36 82,44 70,44 C60,44 58,32 50,32 C42,32 40,44 30,44 C18,44 10,36 10,25 Z'

/**
 * Isotipo aproximado a partir del Brand Toolkit (no es el SVG vectorial
 * original de la marca — reemplazar cuando se disponga del archivo fuente).
 */
export function Logo({ variant = 'mark', negative = false, className = '' }: LogoProps) {
  const gradientId = negative ? 'emt-mark-negative' : 'emt-mark'

  const mark = (
    <svg viewBox="0 0 100 50" className={variant === 'mark' ? className || 'h-8 w-16' : 'h-7 w-14'} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          {negative ? (
            <>
              <stop offset="0%" stopColor="#FBFEE8" />
              <stop offset="100%" stopColor="#EFFD9E" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#043860" />
              <stop offset="55%" stopColor="#00578E" />
              <stop offset="100%" stopColor="#EFFD9E" />
            </>
          )}
        </linearGradient>
      </defs>
      <path d={MARK_PATH} fill={`url(#${gradientId})`} />
    </svg>
  )

  if (variant === 'mark') return mark

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`font-display text-xl font-semibold tracking-tight ${negative ? 'text-white' : 'text-midnight-900'}`}>
        EMT
      </span>
      {mark}
      <span className={`font-display text-xs font-medium uppercase leading-tight tracking-wide ${negative ? 'text-white' : 'text-midnight-900'}`}>
        Medical
        <br />
        Group
      </span>
    </div>
  )
}
