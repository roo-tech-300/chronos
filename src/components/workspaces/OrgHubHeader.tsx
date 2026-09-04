import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import logoImg from '../../assets/logo.png'
import { useAuth } from '../../context/useAuth'
import { useDevPersona } from '../../context/DevPersonaContext'
import { Badge, Button } from '../ui'

interface OrgHubHeaderProps {
  onOpenLogout: () => void
}

export function OrgHubHeader({ onOpenLogout }: OrgHubHeaderProps) {
  const { user, profile } = useAuth()
  const { role, currentDepartment, currentStaff } = useDevPersona()

  const displayName =
    profile?.fullName ||
    (role === 'admin'
      ? 'Alex Vance'
      : role === 'hod'
        ? currentDepartment.lead
        : currentStaff.name)

  const email = user?.email || profile?.email || `${role}@natale.corp`
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'

  return (
    <header className="w-full bg-white/85 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/workspaces" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <img src={logoImg} alt="Chronos" className="w-7 h-7 object-contain rounded" />
          <span className="text-lg font-bold text-zinc-900 tracking-tight">Chronos</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 pr-3 border-r border-zinc-200">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#7c007e] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials}
              </div>
            )}
            <div className="text-left leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-800">{displayName}</span>
                <Badge variant="purple" size="sm">
                  {role.toUpperCase()}
                </Badge>
              </div>
              <span className="text-[11px] text-zinc-400">{email}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<LogOut size={15} />}
            onClick={onOpenLogout}
            className="text-zinc-600 hover:text-red-600 hover:bg-red-50"
            aria-label="Sign out"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
