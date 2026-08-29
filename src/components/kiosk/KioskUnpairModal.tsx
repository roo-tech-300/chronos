import { useEffect } from 'react'

interface KioskUnpairModalProps {
  isOpen: boolean
  onClose: () => void
  onUnpair: () => void
}

export function KioskUnpairModal({ isOpen, onClose, onUnpair }: KioskUnpairModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#141418] border border-white/15 rounded-2xl p-6 max-w-sm w-full text-center">
        <h3 className="text-base font-bold text-white mb-2">Unpair Hardware Station?</h3>
        <p className="text-xs text-zinc-400 mb-6">
          This will wipe the permanent cryptographic token from this laptop. The machine will need to be re-paired with a new code.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onUnpair()
              onClose()
            }}
            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Unpair Device
          </button>
        </div>
      </div>
    </div>
  )
}
