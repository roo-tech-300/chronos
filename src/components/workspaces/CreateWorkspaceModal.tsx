import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Building2, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '../ui'
import type { WorkspaceDraft, Workspace } from '../../types/workspaces'
import { StepBasics } from './steps/StepBasics'
import { StepBranding } from './steps/StepBranding'
import { StepReview } from './steps/StepReview'
import { createWorkspace } from '../../services/workspaces'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newWorkspace: Workspace) => void
}

const INITIAL_DRAFT: WorkspaceDraft = {
  name: '',
  category: 'Technology',
  accentColor: '#4f46e5',
}

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [draft, setDraft] = useState<WorkspaceDraft>(INITIAL_DRAFT)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleUpdateDraft = (updates: Partial<WorkspaceDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!draft.name.trim()) {
        setErrorMsg('Please enter an organization name')
        return
      }
      setErrorMsg(null)
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setErrorMsg(null)
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      handleNext()
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    const { data, error } = await createWorkspace(draft)

    if (error || !data) {
      setErrorMsg(error?.message || 'Failed to create workspace')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onSuccess(data)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Step indicator */}
        <div className="px-6 pt-5 pb-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7c007e] flex items-center justify-center text-white shadow-xs">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 leading-tight">Create Workspace</h3>
              <p className="text-xs text-zinc-500">
                {step === 1 && 'Step 1 of 3: Organization Basics'}
                {step === 2 && 'Step 2 of 3: Identity & Custom Palette'}
                {step === 3 && 'Step 3 of 3: Confirm & Launch'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-purple-50 h-1">
          <div
            className="h-full bg-[#7c007e] transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {step === 1 && <StepBasics draft={draft} onChange={handleUpdateDraft} />}
          {step === 2 && <StepBranding draft={draft} onChange={handleUpdateDraft} />}
          {step === 3 && <StepReview draft={draft} />}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-6">
            {step > 1 ? (
              <Button type="button" variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />} onClick={handleBack}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                rightIcon={<ArrowRight size={16} />}
                onClick={handleNext}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                rightIcon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              >
                {isSubmitting ? 'Creating...' : 'Launch Workspace'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
