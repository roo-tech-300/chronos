import React from 'react'
import type { PunctualityEvaluation } from '../../types/shifts'

interface PunctualityBadgeProps {
  evaluation: PunctualityEvaluation
  className?: string
}

export const PunctualityBadge: React.FC<PunctualityBadgeProps> = ({
  evaluation,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    info: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    neutral: 'bg-zinc-400',
    info: 'bg-purple-500',
  }

  const style = variantStyles[evaluation.badgeVariant] || variantStyles.neutral
  const dotColor = dotColors[evaluation.badgeVariant] || dotColors.neutral

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{evaluation.statusLabel}</span>
    </span>
  )
}
