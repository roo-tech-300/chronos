import { useEffect, useState } from 'react'
import { LogOut, AlertCircle } from 'lucide-react'
import { Button } from '../ui'
import { useAuth } from '../../context/useAuth'
import { useDevPersona } from '../../context/DevPersonaContext'
import { LogoutUserCard } from './LogoutUserCard'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmLogout: () => Promise<void>
}

export function LogoutModal({ isOpen, onClose, onConfirmLogout }: LogoutModalProps) {
  const { user, profile } = useAuth()
  const { role, currentDepartment, currentStaff } = useDevPersona()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const displayName =
    profile?.fullName ||
    (role === 'admin'
      ? 'Alex Vance'
      : role === 'hod'
        ? currentDepartment.lead
        : currentStaff.name)
  const email = user?.email || profile?.email || `${role}@natale.corp`
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'

  const handleSignOut = async () => {
    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      await onConfirmLogout()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out. Please try again.'
      setErrorMsg(message)
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="w-13 h-13 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <LogOut size={26} />
        </div>

        <div className="text-center mb-5">
          <h3 id="logout-title" className="text-lg font-bold text-zinc-900 tracking-tight mb-1">
            Sign out of Chronos?
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            You will need to sign in again with your credentials to access your workspaces.
          </p>
        </div>

        <LogoutUserCard
          displayName={displayName}
          email={email}
          initials={initials}
          avatarUrl={profile?.avatarUrl}
          role={role}
        />

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 justify-center"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1 justify-center"
            onClick={handleSignOut}
            isLoading={isSubmitting}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
