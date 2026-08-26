import { useLocation } from 'react-router-dom'
import { useDevPersona } from '../../context/DevPersonaContext'
import { useAuth } from '../../context/useAuth'
import { homePathForRole } from '../../utils/homeRoute'
import type { Workspace } from '../../types/workspaces'

interface UseNavbarStateProps {
  brandName?: string
  brandLogo?: string
  workspaceId?: string
  currentWorkspace: Workspace | null
}

export function useNavbarState({
  brandName,
  brandLogo,
  workspaceId,
  currentWorkspace,
}: UseNavbarStateProps) {
  const location = useLocation()
  const pathname = location.pathname
  const { role, currentDepartment, currentStaff } = useDevPersona()
  const { profile, user } = useAuth()

  const activeBrandName = brandName || currentWorkspace?.name || 'Natale'
  const activeBrandLogo = brandLogo || currentWorkspace?.avatarUrl

  const prefix = workspaceId ? `/workspace/${workspaceId}` : ''
  const isSettingsActive = pathname.includes('/setting')
  const isDashboardActive =
    pathname === `${prefix}/dashboard` ||
    pathname === `${prefix}` ||
    pathname === '/dashboard' ||
    pathname === '/'
  const isStaffActive = pathname.includes('/staff')
  const isDevicesActive = pathname.includes('/devices')
  const isAnalyticsActive = pathname.includes('/analytics')
  const isTasksActive = pathname.includes('/tasks')
  const homePath = workspaceId ? `${prefix}/dashboard` : homePathForRole(role)

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

  return {
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
  }
}
