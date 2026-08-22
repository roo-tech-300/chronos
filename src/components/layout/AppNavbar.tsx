import { Link, useLocation } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'
import nataleLogo from '../../assets/companies/natale.png'
import { useDevPersona } from '../../context/DevPersonaContext'

interface AppNavbarProps {
  brandName?: string
  brandLogo?: string
}

export default function AppNavbar({
  brandName = 'Natale',
  brandLogo = nataleLogo,
}: AppNavbarProps) {
  const location = useLocation()
  const pathname = location.pathname
  const { role, currentDepartment } = useDevPersona()

  const isSettingsActive = pathname.startsWith('/setting')
  const isDashboardActive = pathname === '/dashboard' || pathname === '/'
  const isStaffActive = pathname.startsWith('/staff')
  const isDevicesActive = pathname.startsWith('/devices')
  const isAnalyticsActive = pathname.startsWith('/analytics')
  const isTasksActive = pathname.startsWith('/tasks')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f8f9fa]/80 backdrop-blur-md border-b border-zinc-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6 max-w-7xl mx-auto w-full">
        {/* Left: Brand & Nav links */}
        <div className="flex items-center gap-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 text-xl font-bold text-[#111827] hover:opacity-90 transition-opacity"
          >
            <img src={brandLogo} alt={brandName} className="w-7 h-7 object-contain rounded" />
            <span>{brandName}</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`text-[15px] font-medium transition-all pb-1 border-b-2 ${
                isDashboardActive
                  ? 'text-[#111827] font-semibold border-[#111827]'
                  : 'text-zinc-500 hover:text-[#111827] border-transparent'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/staff"
              className={`text-[15px] font-medium transition-all pb-1 border-b-2 ${
                isStaffActive
                  ? 'text-[#111827] font-semibold border-[#111827]'
                  : 'text-zinc-500 hover:text-[#111827] border-transparent'
              }`}
            >
              Staff
            </Link>

            {role === 'admin' ? (
              <>
                <Link
                  to="/devices"
                  className={`text-[15px] font-medium transition-all pb-1 border-b-2 ${
                    isDevicesActive
                      ? 'text-[#111827] font-semibold border-[#111827]'
                      : 'text-zinc-500 hover:text-[#111827] border-transparent'
                  }`}
                >
                  Devices
                </Link>
                <Link
                  to="/analytics"
                  className={`text-[15px] font-medium transition-all pb-1 border-b-2 ${
                    isAnalyticsActive
                      ? 'text-[#111827] font-semibold border-[#111827]'
                      : 'text-zinc-500 hover:text-[#111827] border-transparent'
                  }`}
                >
                  Analytics
                </Link>
              </>
            ) : (
              <Link
                to="/tasks"
                className={`text-[15px] font-medium transition-all pb-1 border-b-2 ${
                  isTasksActive
                    ? 'text-[#111827] font-semibold border-[#111827]'
                    : 'text-zinc-500 hover:text-[#111827] border-transparent'
                }`}
              >
                Tasks
              </Link>
            )}
          </div>
        </div>

        {/* Right: Actions & Avatar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 text-zinc-500 hover:text-[#111827] hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={20} />
          </button>

          {/* Settings ONLY for Admin */}
          {role === 'admin' && (
            <Link
              to="/settings/organization"
              className={`p-2 rounded-lg transition-colors ${
                isSettingsActive
                  ? 'text-[#111827] bg-zinc-200/70 font-semibold'
                  : 'text-zinc-500 hover:text-[#111827] hover:bg-zinc-100'
              }`}
              title="Organization Settings"
            >
              <Settings size={20} />
            </Link>
          )}

          <div
            className="flex items-center gap-2 pl-1"
            title={role === 'admin' ? 'Super Administrator' : `Head of ${currentDepartment.name}`}
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center text-[11px] font-bold tracking-wider">
              {role === 'admin' ? 'AV' : 'RC'}
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[#111827]">
                {role === 'admin' ? 'Alex Vance' : currentDepartment.lead}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                {role === 'admin' ? 'Admin' : 'HOD'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

