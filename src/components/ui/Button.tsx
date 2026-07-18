import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 disabled:opacity-40 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-teal-500 text-white hover:bg-teal-600',
  secondary: 'bg-white text-midnight-950 border border-slate-200 hover:bg-slate-50',
  ghost: 'bg-transparent text-midnight-700 hover:bg-slate-100',
  danger: 'bg-[#DC4B3E] text-white hover:bg-[#c33f33]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}
