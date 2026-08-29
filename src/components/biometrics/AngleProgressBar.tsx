import { Check } from 'lucide-react'
import type { ScanAngleStep } from '../../types/biometric'

interface AngleProgressBarProps {
  steps: ScanAngleStep[]
  activeStep: number
  completedAngles: Record<string, boolean>
}

export function AngleProgressBar({ steps, activeStep, completedAngles }: AngleProgressBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
      {steps.map((step, idx) => {
        const isCompleted = !!completedAngles[step.angle]
        const isCurrent = activeStep === idx && !isCompleted

        return (
          <div
            key={step.angle}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              isCompleted
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs'
                : isCurrent
                ? 'bg-white border-[#7c007e] ring-2 ring-[#7c007e]/15 shadow-xs'
                : 'bg-zinc-100/50 border-zinc-200/60 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-[#7c007e] text-white'
                    : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </span>
              <span
                className={`text-[11px] font-bold tracking-tight ${
                  isCompleted ? 'text-emerald-800' : isCurrent ? 'text-zinc-900' : 'text-zinc-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 leading-tight">
              {step.description}
            </span>
          </div>
        )
      })}
    </div>
  )
}
