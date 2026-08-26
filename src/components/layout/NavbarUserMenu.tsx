import { useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, User as UserIcon, LogOut } from 'lucide-react'
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

  return (
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
            {role === 'admin' ? 'Admin' : role === 'hod' ? 'HOD' : currentStaffRole}
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
              <UserIcon size={14} className="text-zinc-500" />
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
  )
}
