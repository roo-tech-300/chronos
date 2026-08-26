import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, SlidersHorizontal, Plus, Bell, ChevronDown, RefreshCw, Building2, FolderPlus } from 'lucide-react'
import { Button, Badge, SearchInput } from './components/ui'
import { useDevPersona } from './context/DevPersonaContext'
import { useAuth } from './context/useAuth'
import { homePathForRole } from './utils/homeRoute'
import { getUserWorkspaces } from './services/workspaces'
import { CreateWorkspaceModal } from './components/workspaces/CreateWorkspaceModal'
import type { Workspace } from './types/workspaces'
import logoImg from './assets/logo.png'
import './styles/org-hub-nav.css'
import './styles/org-hub-grid.css'
import './styles/org-hub-foot.css'

export default function OrgHubPage() {
  const { role } = useDevPersona()
  const { user, profile } = useAuth()
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

  const filteredWorkspaces = dbWorkspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ws.category && ws.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const userInitials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'JD'

  return (
    <div className="org-page">
      <header className="org-navbar">
        <div className="org-navbar-inner">
          <div className="org-nav-left">
            <Link to="/" className="org-nav-brand">
              <img src={logoImg} alt="Chronos" className="org-nav-logo" />
              <span>Chronos</span>
            </Link>
            <nav className="org-nav-links">
              <a href="#" className="active">Workspaces</a>
              <a href="#">Explore</a>
              <a href="#">Architecture</a>
              <a href="#">Support</a>
            </nav>
          </div>
          <div className="org-nav-right">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
            >
              New Workspace
            </Button>
            <div className="org-nav-divider" />
            <button className="org-nav-icon-btn">
              <Bell size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
              <div className="org-nav-avatar">{userInitials}</div>
              <ChevronDown size={16} style={{ color: 'var(--oh-on-surface-variant)' }} />
            </div>
          </div>
        </div>
      </header>

      <main className="org-content">
        <div className="org-hero">
          <div className="org-hero-top">
            <div>
              <h2>Select Workspace</h2>
              <p>Choose an organization to continue or create a new one to start managing physical identities and security infrastructure.</p>
            </div>
            {dbWorkspaces.length > 0 && (
              <div className="org-hero-actions">
                <div className="w-64">
                  <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm('')}
                    placeholder="Search workspaces..."
                  />
                </div>
                <Button variant="secondary" size="md">
                  <SlidersHorizontal size={18} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 gap-2">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm">Loading workspaces...</span>
          </div>
        ) : dbWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto my-8">
            <div className="w-20 h-20 bg-purple-50 border border-purple-100 rounded-full flex items-center justify-center text-[#7c007e] mb-4 shadow-xs">
              <Building2 size={38} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">No workspaces yet</h2>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">
              You aren't a member of any workspaces. Create your first organization workspace to get started.
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
              const accent = ws.accentColor || '#4f46e5'
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
                    <Link to={homePathForRole(role)}>
                      <Button variant="primary" size="sm">
                        Select
                      </Button>
                    </Link>
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

        <div className="org-support">
          <p>
            Need help managing your workspaces? <a href="#">Contact Support</a>
          </p>
        </div>
      </main>

      <footer className="org-footer">
        <div className="org-footer-inner">
          <div className="org-footer-left">
            <span className="org-footer-version">CHRONOS CORE v2.4</span>
            <p className="org-footer-copy">&copy; 2024 Chronos Identity Infrastructure. All rights reserved.</p>
          </div>
          <div className="org-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security Architecture</a>
            <div className="org-footer-status">
              <span className="pulse-dot" />
              <a href="#">System Status</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Multi-Step Modal */}
      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  )
}
