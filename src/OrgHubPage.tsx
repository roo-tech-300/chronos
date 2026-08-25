import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, SlidersHorizontal, Plus, Bell, ChevronDown, RefreshCw, Building2, FolderPlus } from 'lucide-react'
import { Button, Badge, SearchInput } from './components/ui'
import futminnaLogo from './assets/logo.jpg'
import kangarooLogo from './assets/companies/KangarooTech.png'
import nataleLogo from './assets/companies/natale.png'
import { useDevPersona } from './context/DevPersonaContext'
import { useAuth } from './context/useAuth'
import { homePathForRole } from './utils/homeRoute'
import { getUserWorkspaces, createWorkspace } from './services/workspaces'
import type { Workspace } from './types/workspaces'
import logoImg from './assets/logo.png'
import './styles/org-hub-nav.css'
import './styles/org-hub-grid.css'
import './styles/org-hub-foot.css'

const logoMap: Record<string, string> = {
  futminna: futminnaLogo,
  kangaroo: kangarooLogo,
  natale: nataleLogo,
}

export default function OrgHubPage() {
  const { role } = useDevPersona()
  const { user, profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [dbWorkspaces, setDbWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newWsName, setNewWsName] = useState('')

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

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWsName.trim()) return

    const slug = newWsName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)
    const { data, error: createErr } = await createWorkspace(newWsName.trim(), slug, 'starter')

    if (createErr) {
      alert(`Error creating workspace: ${createErr.message}`)
      return
    }

    if (data) {
      setDbWorkspaces((prev) => [data, ...prev])
      setNewWsName('')
      setIsCreating(false)
    }
  }

  // Map real database workspaces to display objects
  const displayWorkspaces = dbWorkspaces.map((ws) => ({
    id: ws.id,
    name: ws.name,
    logoId: ws.slug.includes('kangaroo') ? 'kangaroo' : ws.slug.includes('futminna') ? 'futminna' : 'natale',
    role: ws.role.charAt(0).toUpperCase() + ws.role.slice(1),
    memberCount: ws.memberCount || 1,
    category: (ws.plan || 'STARTER').toUpperCase(),
    lastActive: 'Active now',
  }))

  const filteredWorkspaces = displayWorkspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.category.toLowerCase().includes(searchTerm.toLowerCase())
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
              onClick={() => setIsCreating(true)}
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

        {/* Create workspace modal / inline prompt */}
        {isCreating && (
          <div className="mb-6 p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-2">Create New Organization Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="flex gap-3 items-center">
              <input
                type="text"
                className="flex-1 px-3.5 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900"
                placeholder="e.g. Acme Corp, Research Lab"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                autoFocus
              />
              <Button type="submit" variant="primary" size="md">
                Create
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 gap-2">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm">Loading workspaces...</span>
          </div>
        ) : dbWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto my-8">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 mb-4">
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
              onClick={() => setIsCreating(true)}
            >
              Create Your First Workspace
            </Button>
          </div>
        ) : (
          <div className="org-grid">
            {filteredWorkspaces.map((ws) => (
              <div key={ws.id} className="org-card">
                <div>
                  <div className="org-card-header">
                    <div className={'org-card-icon ' + (ws.role === 'Member' ? 'gray' : 'purple')}>
                      {logoMap[ws.logoId] ? (
                        <img src={logoMap[ws.logoId]} alt={ws.name} className="org-card-logo" />
                      ) : (
                        <Building2 size={24} className="text-zinc-600" />
                      )}
                    </div>
                    <Badge variant={ws.role === 'Member' ? 'neutral' : 'purple'} size="sm">
                      {ws.role}
                    </Badge>
                  </div>
                  <h3>{ws.name}</h3>
                  <div className="org-card-meta">
                    <span>{ws.memberCount} Members</span>
                    <span className="dot" />
                    <span>{ws.category}</span>
                  </div>
                </div>
                <div className="org-card-footer">
                  <span className="last-active">{ws.lastActive}</span>
                  <Link to={homePathForRole(role)}>
                    <Button variant="primary" size="sm">
                      Select
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            <div className="org-card-create cursor-pointer" onClick={() => setIsCreating(true)}>
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
    </div>
  )
}
