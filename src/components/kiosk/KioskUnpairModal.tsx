import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../ui'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <AlertTriangle size={28} />
        </div>

        <h3 className="text-lg font-bold text-zinc-900 mb-1.5">Unpair Hardware Station?</h3>
        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
          This will wipe the permanent cryptographic token from this PC. The machine will need to be re-paired by an administrator.
        </p>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1 justify-center"
            onClick={() => {
              onUnpair()
              onClose()
            }}
          >
            Unpair Device
          </Button>
        </div>
      </div>
    </div>
  )
}
