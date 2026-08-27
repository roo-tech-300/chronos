import { useState, useEffect } from 'react'
import { Copy, Check, QrCode, RefreshCw, X, Loader2, Database } from 'lucide-react'
import { Button } from '../ui'
import type { TerminalDevice } from '../../types/terminal'

interface PairingCodeModalProps {
  terminal: TerminalDevice | null
  isOpen: boolean
  onClose: () => void
  onRegenerateCode: (terminalId: string) => Promise<string>
}

export function PairingCodeModal({
  terminal,
  isOpen,
  onClose,
  onRegenerateCode,
}: PairingCodeModalProps) {
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  // Native Escape key listener for accessible dismissal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRegenerating) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isRegenerating, onClose])

  if (!isOpen || !terminal) return null

  const displayCode = generatedCode || terminal.pairingCode || 'CH-XX-0000'

  const handleCopy = () => {
    if (!displayCode) return
    navigator.clipboard.writeText(displayCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setGeneratedCode(null)
    onClose()
  }

  const handleRegen = async () => {
    setIsRegenerating(true)
    try {
      const newCode = await onRegenerateCode(terminal.id)
      if (newCode) {
        setGeneratedCode(newCode)
      }
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRegenerating) {
          handleClose()
        }
      }}
    >
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden text-center animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-[#7c007e]" />
            <span className="font-bold text-zinc-900 text-sm">Pair Hardware Kiosk</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isRegenerating}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-40"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs text-zinc-500 mb-1">Station Name</p>
          <h4 className="text-base font-bold text-zinc-900 mb-4 truncate">{terminal.name}</h4>

          {/* Code Container with Loading State */}
          <div className="relative bg-purple-50/80 border border-purple-200/80 rounded-2xl p-5 mb-4 transition-all overflow-hidden min-h-[140px] flex flex-col justify-center">
            {isRegenerating ? (
              <div className="py-2 flex flex-col items-center justify-center gap-2.5 animate-in fade-in duration-150">
                <div className="w-10 h-10 rounded-full bg-purple-100/80 flex items-center justify-center text-[#7c007e]">
                  <Loader2 size={22} className="animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#7c007e] block">
                    Generating & Saving to Database...
                  </span>
                  <span className="text-[11px] text-zinc-500 flex items-center justify-center gap-1 mt-0.5">
                    <Database size={11} className="text-zinc-400" />
                    Updating Supabase record
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-widest block">
                    One-Time Activation Code
                  </span>
                </div>

                <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider sm:tracking-widest text-[#7c007e] my-1 select-all">
                  {displayCode}
                </div>

                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Valid for 15 minutes. Enter this code on the kiosk machine at{' '}
                  <span className="font-mono font-medium text-zinc-700">/terminal/pair</span>.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              disabled={isRegenerating}
              leftIcon={copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              onClick={handleCopy}
            >
              {copied ? 'Copied Code' : 'Copy Code'}
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />}
              onClick={handleRegen}
              isLoading={isRegenerating}
              disabled={isRegenerating}
            >
              {isRegenerating ? 'Saving...' : 'New Code'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
