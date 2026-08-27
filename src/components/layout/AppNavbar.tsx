import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bell, Settings, Building2 } from 'lucide-react'
import nataleLogo from '../../assets/companies/natale.png'
import { useAuth } from '../../context/useAuth'
import { useWorkspace } from '../../context/useWorkspace'
import { useNavbarState } from './useNavbarState'
import { NavbarUserMenu } from './NavbarUserMenu'

interface AppNavbarProps {
  brandName?: string
  brandLogo?: string
}

export default function AppNavbar({
  brandName,
  brandLogo,
}: AppNavbarProps) {
  const { workspaceId } = useParams<{ workspaceId?: string }>()
  const { signOut } = useAuth()
  const { currentWorkspace, selectWorkspace, accentColor } = useWorkspace()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Synchronize workspace if workspaceId is present in URL
  useEffect(() => {
    if (workspaceId && currentWorkspace?.id !== workspaceId) {
      selectWorkspace(workspaceId)
    }
  }, [workspaceId, currentWorkspace?.id, selectWorkspace])

  const {
    prefix,
    role,
    user,
    profile,
    displayName,
    initials,
    currentStaff,
    activeBrandName,
    activeBrandLogo,
    homePath,
    isSettingsActive,
    isDashboardActive,
    isStaffActive,
    isDevicesActive,
    isAnalyticsActive,
    isTasksActive,
  } = useNavbarState({
    brandName,
    brandLogo,
    workspaceId,
    currentWorkspace,
  })

  const finalBrandLogo = activeBrandLogo || nataleLogo

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
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 min-w-0">
          <Link
            to={homePath}
            title={activeBrandName}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[150px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[340px] hover:opacity-90 transition-opacity"
          >
            <img
              src={finalBrandLogo}
              alt={activeBrandName}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded shrink-0"
            />
            <span className="text-base sm:text-lg md:text-xl font-bold text-zinc-900 tracking-tight truncate">
              {activeBrandName}
            </span>
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
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/workspaces"
            className="hidden min-[1120px]:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-purple-700 bg-zinc-100 hover:bg-purple-50 rounded-lg transition-colors"
            title="Switch Workspace"
          >
            <Building2 size={14} />
            <span>Workspaces</span>
          </Link>

          <button
            type="button"
            className="hidden min-[1120px]:flex p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={20} />
          </button>

          {/* Settings ONLY for Admin */}
          {role === 'admin' && (
            <Link
              to={`${prefix}/settings/organization`}
              className={`hidden min-[1120px]:flex p-2 rounded-lg transition-colors ${
                isSettingsActive
                  ? 'text-purple-700 bg-purple-100/70 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Organization Settings"
            >
              <Settings size={20} />
            </Link>
          )}

          {/* User Profile Menu with Dropdown Modal */}
          <NavbarUserMenu
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            profile={profile}
            user={user}
            displayName={displayName}
            initials={initials}
            accentColor={accentColor}
            role={role}
            currentStaffRole={currentStaff.role}
            homePath={homePath}
            prefix={prefix}
            onSignOut={signOut}
          />
        </div>
      </div>
    </nav>
  )
}
