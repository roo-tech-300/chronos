import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Bell, Settings, LogOut, User, Building2 } from 'lucide-react'
import nataleLogo from '../../assets/companies/natale.png'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useAuth } from '../../context/useAuth'
import { useWorkspace } from '../../context/useWorkspace'
import { homePathForRole } from '../../utils/homeRoute'

interface AppNavbarProps {
  brandName?: string
  brandLogo?: string
}

export default function AppNavbar({
  brandName,
  brandLogo,
}: AppNavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const { workspaceId } = useParams<{ workspaceId?: string }>()
  const { role, currentDepartment, currentStaff } = useDevPersona()
  const { profile, user, signOut } = useAuth()
  const { currentWorkspace, selectWorkspace, accentColor } = useWorkspace()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Synchronize workspace if workspaceId is present in URL
  useEffect(() => {
    if (workspaceId && currentWorkspace?.id !== workspaceId) {
      selectWorkspace(workspaceId)
    }
  }, [workspaceId, currentWorkspace?.id, selectWorkspace])

  const activeBrandName = brandName || currentWorkspace?.name || 'Natale'
  const activeBrandLogo = brandLogo || currentWorkspace?.avatarUrl || nataleLogo

  const prefix = workspaceId ? `/workspace/${workspaceId}` : ''
  const isSettingsActive = pathname.includes('/setting')
  const isDashboardActive = pathname === `${prefix}/dashboard` || pathname === `${prefix}` || pathname === '/dashboard' || pathname === '/'
  const isStaffActive = pathname.includes('/staff')
  const isDevicesActive = pathname.includes('/devices')
  const isAnalyticsActive = pathname.includes('/analytics')
  const isTasksActive = pathname.includes('/tasks')
  const homePath = workspaceId ? `${prefix}/dashboard` : homePathForRole(role)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setDropdownOpen(false)
    navigate('/login')
  }

  const displayName =
    profile?.fullName ||
    (role === 'admin'
      ? 'Alex Vance'
      : role === 'hod'
        ? currentDepartment.lead
        : currentStaff.name)

  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'

  const navLinkClass = (active: boolean) =>
    `text-[15px] font-medium transition-all pb-1 border-b-2 ${
      active
        ? 'text-[#7c007e] font-semibold border-[#7c007e]'
        : 'text-zinc-500 hover:text-zinc-900 border-transparent'
    }`

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f8f9fa]/85 backdrop-blur-md border-b border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto w-full">
        {/* Left: Brand & nav links */}
        <div className="flex items-center gap-8">
          <Link
            to={homePath}
            className="flex items-center gap-2.5 text-xl font-bold text-zinc-900 hover:opacity-90 transition-opacity"
          >
            <img src={activeBrandLogo} alt={activeBrandName} className="w-7 h-7 object-contain rounded" />
            <span>{activeBrandName}</span>
          </Link>

          {role === 'staff' ? (
            <div className="hidden sm:flex items-center gap-6">
              <Link to={`${prefix}/tasks/my-tasks`} className={navLinkClass(isTasksActive)}>
                My Tasks
              </Link>
            </div>
          ) : role === 'hod' ? (
            <div className="hidden sm:flex items-center gap-6">
              <Link to={`${prefix}/dashboard`} className={navLinkClass(isDashboardActive)}>
                Dashboard
              </Link>
              <Link to={`${prefix}/staff`} className={navLinkClass(isStaffActive)}>
                Staff
              </Link>
              <Link to={`${prefix}/tasks`} className={navLinkClass(isTasksActive)}>
                Tasks
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-6">
              <Link to={`${prefix}/dashboard`} className={navLinkClass(isDashboardActive)}>
                Dashboard
              </Link>
              <Link to={`${prefix}/staff`} className={navLinkClass(isStaffActive)}>
                Staff
              </Link>
              <Link to={`${prefix}/devices`} className={navLinkClass(isDevicesActive)}>
                Devices
              </Link>
              <Link to={`${prefix}/analytics`} className={navLinkClass(isAnalyticsActive)}>
                Analytics
              </Link>
              <Link to={`${prefix}/tasks`} className={navLinkClass(isTasksActive)}>
                Tasks
              </Link>
            </div>
          )}
        </div>

        {/* Right: Actions & Avatar */}
        <div className="flex items-center gap-3">
          <Link
            to="/workspaces"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-purple-700 bg-zinc-100 hover:bg-purple-50 rounded-lg transition-colors"
            title="Switch Workspace"
          >
            <Building2 size={14} />
            <span>Workspaces</span>
          </Link>

          <button
            type="button"
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={20} />
          </button>

          {/* Settings ONLY for Admin */}
          {role === 'admin' && (
            <Link
              to={`${prefix}/settings/organization`}
              className={`p-2 rounded-lg transition-colors ${
                isSettingsActive
                  ? 'text-purple-700 bg-purple-100/70 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Organization Settings"
            >
              <Settings size={20} />
            </Link>
          )}

          {/* User Profile Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-1 cursor-pointer focus:outline-none"
              aria-expanded={dropdownOpen}
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[11px] font-bold tracking-wider"
                  style={{ backgroundColor: accentColor || '#7c007e' }}
                >
                  {initials}
                </div>
              )}
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-zinc-900">{displayName}</span>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                  {role === 'admin' ? 'Admin' : role === 'hod' ? 'HOD' : currentStaff.role}
                </span>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50 text-xs text-zinc-700">
                <div className="px-3.5 py-2.5 border-b border-zinc-100">
                  <p className="font-semibold text-zinc-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {user?.email || profile?.email || `${role}@natale.corp`}
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    to="/workspaces"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-purple-50 text-zinc-700 hover:text-purple-700 transition-colors"
                  >
                    <Building2 size={14} className="text-zinc-500" />
                    <span>Switch Workspace</span>
                  </Link>
                  <Link
                    to={homePath}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-zinc-50 transition-colors"
                  >
                    <User size={14} className="text-zinc-500" />
                    <span>Workspace Home</span>
                  </Link>
                </div>
                <div className="border-t border-zinc-100 py-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
