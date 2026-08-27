import { useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, User as UserIcon, LogOut, Bell, Settings } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { AuthProfile } from '../../context/authTypes'

interface NavbarUserMenuProps {
  dropdownOpen: boolean
  setDropdownOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  profile: AuthProfile | null
  user: SupabaseUser | null
  displayName: string
  initials: string
  accentColor?: string
  role: string
  currentStaffRole: string
  homePath: string
  prefix: string
  onSignOut: () => Promise<void>
}

export function NavbarUserMenu({
  dropdownOpen,
  setDropdownOpen,
  profile,
  user,
  displayName,
  initials,
  accentColor,
  role,
  currentStaffRole,
  homePath,
  prefix,
  onSignOut,
}: NavbarUserMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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
  }, [setDropdownOpen])

  const handleSignOut = async () => {
    await onSignOut()
    setDropdownOpen(false)
    navigate('/login')
  }

  const roleLabel = role === 'admin' ? 'Administrator' : role === 'hod' ? 'Department Head' : currentStaffRole || 'Staff'
  const userEmail = user?.email || profile?.email || `${role}@natale.corp`
  const settingsPath = role === 'admin' ? `${prefix}/settings/organization` : `${prefix}/settings/organization`

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger: Avatar + Name on >=1120px, Avatar only on <1120px */}
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-full min-[1120px]:rounded-xl hover:bg-zinc-100/80 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7c007e]/40"
        aria-expanded={dropdownOpen}
        aria-label="User profile menu"
      >
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover border border-zinc-200 shadow-xs shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold tracking-wider shadow-xs shrink-0"
            style={{ backgroundColor: accentColor || '#7c007e' }}
          >
            {initials}
          </div>
        )}

        <div className="hidden min-[1120px]:flex flex-col text-left pr-1">
          <span className="text-xs font-bold text-zinc-900 leading-tight truncate max-w-[130px]">
            {displayName}
          </span>
          <span className="text-[11px] text-zinc-500 leading-tight">
            {roleLabel}
          </span>
        </div>
      </button>

      {/* Dropdown Modal/Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-2 z-50 text-sm text-zinc-700 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* User Details Header */}
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-3">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-zinc-200 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full text-white flex items-center justify-center text-xs font-bold tracking-wider shrink-0"
                style={{ backgroundColor: accentColor || '#7c007e' }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-zinc-900 truncate leading-tight">{displayName}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{userEmail}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-50 text-purple-700">
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="py-1.5">
            <button
              type="button"
              onClick={() => setDropdownOpen(false)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-zinc-500" />
                <span className="text-xs font-medium">Notifications</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold">
                0
              </span>
            </button>

            <Link
              to={settingsPath}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors"
            >
              <Settings size={16} className="text-zinc-500" />
              <span className="text-xs font-medium">Settings</span>
            </Link>

            <Link
              to="/workspaces"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-purple-50 text-zinc-700 hover:text-purple-700 transition-colors"
            >
              <Building2 size={16} className="text-zinc-500" />
              <span className="text-xs font-medium">Switch Workspace</span>
            </Link>

            <Link
              to={homePath}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 transition-colors"
            >
              <UserIcon size={16} className="text-zinc-500" />
              <span className="text-xs font-medium">Workspace Home</span>
            </Link>
          </div>

          {/* Footer Action */}
          <div className="border-t border-zinc-100 pt-1.5 mt-0.5">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
