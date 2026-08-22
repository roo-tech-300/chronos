import type { ReactNode } from 'react'

export type BadgeVariant =
  | 'success'
  | 'neutral'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'dark'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  showDot?: boolean
  pulseDot?: boolean
  leftIcon?: ReactNode
  className?: string
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  showDot = false,
  pulseDot = false,
  leftIcon,
  className = '',
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    success: {
      container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    neutral: {
      container: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      dot: 'bg-zinc-400',
    },
    warning: {
      container: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500',
    },
    danger: {
      container: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
    },
    info: {
      container: 'bg-sky-50 text-sky-700 border-sky-200/80',
      dot: 'bg-sky-500',
    },
    purple: {
      container: 'bg-purple-50 text-purple-700 border-purple-200/80',
      dot: 'bg-purple-500',
    },
    dark: {
      container: 'bg-zinc-900 text-white border-transparent',
      dot: 'bg-emerald-400',
    },
  }

  const sizeStyles = {
    sm: 'text-[11px] font-semibold px-2 py-0.5 gap-1.5',
    md: 'text-xs font-semibold px-2.5 py-1 gap-2',
  }[size]

  const currentVariant = variantStyles[variant]

  return (
    <span
      className={`inline-flex items-center rounded-full border shrink-0 transition-colors ${currentVariant.container} ${sizeStyles} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentVariant.dot} ${
            pulseDot ? 'animate-pulse' : ''
          }`}
        />
      )}
      {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
      <span className="whitespace-nowrap flex items-center gap-1">{children}</span>
    </span>
  )
}

