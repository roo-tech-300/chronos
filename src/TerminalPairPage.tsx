import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Laptop, ShieldCheck, ArrowRight, KeyRound, CheckCircle2, AlertCircle, ArrowLeft, Info } from 'lucide-react'
import { useTerminalAuth } from './hooks/useTerminalAuth'
import { useWorkspace } from './context/useWorkspace'
import { normalizePairingCode } from './utils/pairingCode'
import { Button } from './components/ui'

export default function TerminalPairPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentWorkspace } = useWorkspace()
  const workspaceId = searchParams.get('workspaceId') || currentWorkspace?.id || undefined

  const { pairDevice, isPairing } = useTerminalAuth()

  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successTerminalName, setSuccessTerminalName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const val = e.target.value.toUpperCase()
    setInputCode(val)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = inputCode.trim()
    if (clean.length < 4) {
      setError('Please enter the full activation code (e.g. CH-FA-7X9K).')
      return
    }

    setError(null)
    const normalized = normalizePairingCode(clean)

    try {
      const res = await pairDevice({
        code: normalized,
        workspaceId,
        workspaceName: currentWorkspace?.name,
      })
      if (res.success && res.terminal) {
        setSuccessTerminalName(res.terminal.name)
        setTimeout(() => {
          navigate('/scan')
        }, 1800)
      } else {
        setError(res.error || 'Invalid or expired activation OTP code.')
      }
    } catch {
      setError('Failed to contact server. Please check your network connection.')
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between p-6 sm:p-10 font-sans text-zinc-900">
      {/* Top Header */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7c007e] border border-purple-100 flex items-center justify-center shadow-xs">
            <Laptop size={20} />
          </div>
          <div>
            <span className="text-sm font-bold text-zinc-900 block leading-tight">Chronos Terminal OS</span>
            <span className="text-xs text-zinc-500">Hardware Device Enrollment</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/devices')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Admin</span>
        </button>
      </div>

      {/* Center Card */}
      <div className="w-full max-w-lg mx-auto my-auto">
        {successTerminalName ? (
          <div className="bg-white border border-emerald-200 rounded-2xl p-8 sm:p-10 text-center shadow-lg shadow-emerald-500/5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-1">Device Paired Successfully!</h2>
            <p className="text-sm text-[#7c007e] font-bold mb-2">{successTerminalName}</p>
            <p className="text-xs text-zinc-500">
              Permanent cryptographic token saved to this machine. Redirecting to Scanner...
            </p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-10 shadow-lg shadow-zinc-900/5">
            {/* Step Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#7c007e] border border-purple-100 text-xs font-bold uppercase tracking-wider mb-4">
              <KeyRound size={13} />
              <span>Device Activation</span>
            </div>

            <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-2">
              Enter Station Pairing Code
            </h2>

            {/* Explanatory OTP Instruction Callout */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 mb-6 text-left flex items-start gap-3">
              <Info size={18} className="text-[#7c007e] shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-600 leading-relaxed">
                <span className="font-bold text-zinc-800 block mb-0.5">Receive OTP from your Administrator</span>
                To pair this machine, obtain the one-time <span className="font-semibold text-zinc-900">activation code</span> from your authorized Campus Administrator (issued via <span className="font-semibold text-zinc-800">Admin Dashboard → Devices</span>).
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2 text-left">
                  Activation OTP Code
                </label>
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="e.g. CH-FA-7X9K"
                    value={inputCode}
                    onChange={handleInputChange}
                    className="w-full h-14 px-4 text-center font-mono text-xl sm:text-2xl font-bold uppercase tracking-widest bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 placeholder:font-sans placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#7c007e]/20 focus:border-[#7c007e] focus:bg-white transition-all shadow-xs"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 text-left">
                  Format: <span className="font-mono text-zinc-600 font-semibold">CH-[Org Initials]-[4 Alphanumeric]</span>
                </p>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 py-2.5 px-3.5 rounded-xl mb-6">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-12 text-sm justify-center"
                disabled={isPairing || inputCode.trim().length < 4}
                isLoading={isPairing}
                rightIcon={<ArrowRight size={16} />}
              >
                Pair and Unlock Terminal
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Security Badges */}
      <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#7c007e]" />
          <span>AES-256 Client Cryptographic Token Storage</span>
        </div>
        <span>Chronos Secure Terminal Engine</span>
      </div>
    </div>
  )
}
