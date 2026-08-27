import { useState } from 'react'
import { Plus, X, AlertCircle } from 'lucide-react'
import { Button } from '../ui'
import type { TerminalMode, TerminalDevice } from '../../types/terminal'

interface AddTerminalModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: Omit<TerminalDevice, 'id' | 'status' | 'createdAt'>) => Promise<unknown>
  workspaceId?: string
}

export function AddTerminalModal({
  isOpen,
  onClose,
  onAdd,
  workspaceId,
}: AddTerminalModalProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [departmentName, setDepartmentName] = useState('')
  const [mode, setMode] = useState<TerminalMode>('entry')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !location.trim()) return
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      console.log('[AddTerminalModal] Submitting terminal provision form:', {
        name: name.trim(),
        location: location.trim(),
        workspaceId,
      })
      await onAdd({
        workspaceId,
        name: name.trim(),
        location: location.trim(),
        departmentName: departmentName.trim() || undefined,
        mode,
      })
      onClose()
      setName('')
      setLocation('')
      setDepartmentName('')
      setMode('entry')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[AddTerminalModal] Provision failed with error:', err)
      setErrorMessage(msg || 'Failed to save terminal to database. Check console for details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h3 className="font-bold text-zinc-900">Provision Terminal Device</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Register a permanent physical attendance station.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Database Error</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Terminal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Main Gate - West Entrance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3.5 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7c007e]/15 focus:border-[#7c007e] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Physical Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gate A Turnstile, Level 1"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-10 px-3.5 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7c007e]/15 focus:border-[#7c007e] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Department Tag (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Campus Security or School of Science"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              className="w-full h-10 px-3.5 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#7c007e]/15 focus:border-[#7c007e] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Operating Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['entry', 'exit', 'bidirectional'] as TerminalMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border capitalize transition-all cursor-pointer ${
                    mode === m
                      ? 'bg-[#7c007e] text-white border-[#7c007e] shadow-xs'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button variant="outline" size="md" onClick={onClose} type="button" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              leftIcon={<Plus size={16} />}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Generate Pairing Code
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
