import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Plus, QrCode } from 'lucide-react'
import AppNavbar from './components/layout/AppNavbar'
import { Button, Toolbar } from './components/ui'
import { useDevPersona } from './context/DevPersonaContext'
import { useWorkspace } from './context/useWorkspace'
import { useWorkspaceTerminals } from './hooks/useWorkspaceTerminals'
import { TerminalTable } from './components/terminals/TerminalTable'
import { AddTerminalModal } from './components/terminals/AddTerminalModal'
import { PairingCodeModal } from './components/terminals/PairingCodeModal'
import type { TerminalDevice } from './types/terminal'
import './styles/devices-page.css'

export default function DevicesPage() {
  const { workspaceId = 'fut-minna-main' } = useParams()
  const { role } = useDevPersona()
  const { currentWorkspace } = useWorkspace()

  const {
    terminals,
    createTerminal,
    generatePairingCode,
    revokeTerminal,
  } = useWorkspaceTerminals(workspaceId, currentWorkspace?.name)

  const [searchQuery, setSearchQuery] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [pairModalOpen, setPairModalOpen] = useState(false)
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalDevice | null>(null)

  // Guard: Hardware device and kiosk terminal management is strictly restricted to Admins
  if (role !== 'admin') {
    return <Navigate to={role === 'staff' ? '/tasks/my-tasks' : `/workspace/${workspaceId}/dashboard`} replace />
  }

  const filtered = terminals.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = terminals.filter((t) => t.status === 'online').length
  const unpairedCount = terminals.filter((t) => t.status === 'unpaired').length
  const offlineCount = terminals.filter((t) => t.status === 'offline').length

  const handleOpenPair = (t: TerminalDevice) => {
    setSelectedTerminal(t)
    setPairModalOpen(true)
  }

  const activeTerminal = terminals.find((t) => t.id === selectedTerminal?.id) || selectedTerminal

  const handleRegenerateCode = async (terminalId: string) => {
    const newCode = await generatePairingCode(terminalId)
    setSelectedTerminal((prev) =>
      prev && prev.id === terminalId ? { ...prev, pairingCode: newCode } : prev
    )
    return newCode
  }

  return (
    <div className="dev-page min-h-screen bg-[#fafafa]">
      <AppNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Hardware Terminal Stations</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Manage permanent physical scanning laptops, kiosk devices, and biometric stations.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/terminal/pair"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl shadow-xs transition-colors"
            >
              <QrCode size={15} className="text-zinc-500" />
              <span>Pair Device</span>
            </Link>
            <Button
              variant="primary"
              leftIcon={<Plus size={18} />}
              onClick={() => setAddModalOpen(true)}
            >
              Provision Terminal
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <span className="text-2xl font-extrabold text-zinc-900 block">{terminals.length}</span>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1 block">
              Total Enrolled Stations
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-emerald-600 block">{activeCount}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                Online
              </span>
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1 block">
              Active Kiosks Online
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-zinc-700 block">{unpairedCount + offlineCount}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-bold">
                {unpairedCount} Pending
              </span>
            </div>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-1 block">
              Offline / Pending Pairing
            </span>
          </div>
        </div>

        <Toolbar
          className="mb-6"
          search={{
            placeholder: 'Search stations by name, room, or location...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            onClear: () => setSearchQuery(''),
            width: 'w-full sm:w-80 md:w-96',
          }}
        />

        <TerminalTable
          terminals={filtered}
          onOpenPairModal={handleOpenPair}
          onRevoke={revokeTerminal}
        />
      </main>

      <AddTerminalModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={async (data) => {
          const newTerm = await createTerminal(data)
          setSelectedTerminal(newTerm)
          setPairModalOpen(true)
        }}
        workspaceId={workspaceId}
      />

      <PairingCodeModal
        terminal={activeTerminal}
        isOpen={pairModalOpen}
        onClose={() => setPairModalOpen(false)}
        onRegenerateCode={handleRegenerateCode}
      />
    </div>
  )
}
