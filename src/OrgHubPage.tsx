import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Plus, RefreshCw, Building2, FolderPlus } from 'lucide-react'
import { Button, Badge, SearchInput } from './components/ui'
import { useDevPersona } from './context/DevPersonaContext'
import { useAuth } from './context/useAuth'
import { useWorkspace } from './context/useWorkspace'
import { getUserWorkspaces } from './services/workspaces'
import { CreateWorkspaceModal } from './components/workspaces/CreateWorkspaceModal'
import type { Workspace } from './types/workspaces'
import './styles/org-hub-grid.css'

export default function OrgHubPage() {
  const navigate = useNavigate()
  const { role } = useDevPersona()
  const { user } = useAuth()
  const { selectWorkspace } = useWorkspace()
  const [searchTerm, setSearchTerm] = useState('')
  const [dbWorkspaces, setDbWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function loadWorkspaces() {
      setLoading(true)
      const { data, error: fetchErr } = await getUserWorkspaces(user?.id)
      if (fetchErr) {
        console.warn('Error fetching workspaces:', fetchErr.message)
        setDbWorkspaces([])
      } else if (data) {
        setDbWorkspaces(data)
      }
      setLoading(false)
    }

    loadWorkspaces()
  }, [user?.id])

  const handleWorkspaceCreated = (newWs: Workspace) => {
    setDbWorkspaces((prev) => [newWs, ...prev])
  }

  const handleSelectWorkspace = (ws: Workspace) => {
    selectWorkspace(ws)
    if (role === 'staff') {
      navigate(`/workspace/${ws.id}/tasks/my-tasks`)
    } else {
      navigate(`/workspace/${ws.id}/dashboard`)
    }
  }

  const filteredWorkspaces = dbWorkspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ws.category && ws.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 sm:py-14 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Select Workspace</h1>
            <p className="text-zinc-500 text-sm mt-1 max-w-xl">
              Select an organization to jump back in, or set up a new workspace to start tracking team productivity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                placeholder="Search workspaces..."
              />
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
            >
              New Workspace
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-28 text-zinc-400 gap-2">
            <RefreshCw size={22} className="animate-spin text-[#7c007e]" />
            <span className="text-sm font-medium">Loading workspaces...</span>
          </div>
        ) : dbWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-xl mx-auto my-8 bg-white border border-zinc-200 rounded-2xl shadow-xs">
            <div className="w-20 h-20 bg-purple-50 border border-purple-100 rounded-full flex items-center justify-center text-[#7c007e] mb-4 shadow-xs">
              <Building2 size={38} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">No workspaces yet</h2>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">
              You aren&apos;t a member of any workspaces. Create your first organization workspace to get started.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<FolderPlus size={18} />}
              onClick={() => setIsModalOpen(true)}
            >
              Create Your First Workspace
            </Button>
          </div>
        ) : (
          <div className="org-grid">
            {filteredWorkspaces.map((ws) => {
              const accent = ws.accentColor || '#7c007e'
              return (
                <div key={ws.id} className="org-card">
                  <div>
                    <div className="org-card-header">
                      <div
                        className="org-card-icon"
                        style={{ backgroundColor: ws.avatarUrl ? 'transparent' : accent }}
                      >
                        {ws.avatarUrl ? (
                          <img src={ws.avatarUrl} alt={ws.name} className="org-card-logo" />
                        ) : (
                          <Building2 size={24} className="text-white" />
                        )}
                      </div>
                      <Badge variant="purple" size="sm">
                        {ws.role.toUpperCase()}
                      </Badge>
                    </div>
                    <h3>{ws.name}</h3>
                    <div className="org-card-meta">
                      <span>{ws.memberCount} Members</span>
                      <span className="dot" />
                      <span>{ws.category || 'Technology'}</span>
                    </div>
                  </div>
                  <div className="org-card-footer">
                    <span className="last-active">Active now</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectWorkspace(ws)}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              )
            })}

            <div className="org-card-create cursor-pointer" onClick={() => setIsModalOpen(true)}>
              <div className="org-card-create-icon">
                <PlusCircle size={32} />
              </div>
              <div>
                <h3>New Workspace</h3>
                <p>Start a new project or onboard a new client organization.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  )
}
