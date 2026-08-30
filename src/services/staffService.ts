import { getSupabase } from '../lib/supabase'
import { rosterMembers } from '../dummy/roster-mock'
import { getProfile, slugify, type StaffProfile } from '../dummy/profile-mock'
import { resolveCurrentAuthIdentity, fetchMemberProfilesMap } from './identityResolver'
import { checkBiometricEnrolled } from './biometricService'
import { fetchStaffAttendanceHistory } from './attendanceService'
import type { StaffMember, StaffQueryParams, PaginatedStaffResponse } from '../types/staff'

interface RawMemberRow {
  id: string
  role?: string
  created_at?: string
  user_id?: string
  full_name?: string
  email?: string
  avatar_url?: string
}

export async function fetchPaginatedStaff(
  params: StaffQueryParams
): Promise<PaginatedStaffResponse> {
  const { page, pageSize, search = '', roleTab = 'All Roles', workspaceId, role } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const supabase = getSupabase()

  const currentAuth = await resolveCurrentAuthIdentity()
  const { userId: currentUserId, name: currentUserName, email: currentUserEmail, avatarUrl: currentUserAvatar } = currentAuth

  try {
    let query = supabase
      .from('workspace_members')
      .select('id, role, created_at, user_id', { count: 'exact' })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (roleTab && roleTab !== 'All Roles') {
      const mappedRole = roleTab === 'Administrators' ? 'admin' : roleTab === 'Editors' ? 'editor' : 'staff'
      query = query.eq('role', mappedRole)
    }

    const { data: dbMembers, count: dbCount, error } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (!error && dbMembers && dbMembers.length > 0) {
      const totalItems = dbCount ?? dbMembers.length
      const userIds = dbMembers.map((m: { user_id?: string }) => m.user_id).filter(Boolean) as string[]
      const profilesMap = await fetchMemberProfilesMap(userIds)

      const members: StaffMember[] = (dbMembers as RawMemberRow[]).map((m, index) => {
        const isCurrent = Boolean(currentUserId && m.user_id === currentUserId)
        const userProfile = m.user_id ? profilesMap[m.user_id] : null
        const fallbackSeed = rosterMembers[index % rosterMembers.length]

        const memberName =
          (isCurrent && currentUserName)
            ? currentUserName
            : (userProfile?.full_name || m.full_name || fallbackSeed?.name || currentUserName || 'Team Member')

        const memberEmail =
          (isCurrent && currentUserEmail)
            ? currentUserEmail
            : (userProfile?.email || m.email || fallbackSeed?.email || currentUserEmail || 'member@chronos.io')

        const avatarUrl = isCurrent
          ? (currentUserAvatar || userProfile?.avatar_url)
          : (userProfile?.avatar_url || m.avatar_url)

        const staffCode = m.user_id
          ? `CHR-${m.user_id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
          : `CHR-${String(from + index + 1000).padStart(4, '0')}`

        return {
          id: m.id,
          userId: m.user_id,
          staffCode,
          name: memberName,
          email: memberEmail,
          role: m.role === 'admin' ? 'Administrator' : m.role === 'editor' ? 'Editor' : 'Staff',
          status: index % 2 === 0 ? 'On-Site' : 'Off-Site',
          avatarUrl,
          workspaceId,
          createdAt: m.created_at,
        }
      })

      return {
        members,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
        currentPage: page,
        pageSize,
      }
    }
  } catch (err) {
    console.warn('Fallback to local dataset:', err)
  }

  // Fallback dataset
  const userEntry: StaffMember = {
    id: currentUserId ? `wm_${currentUserId.replace(/-/g, '').slice(0, 12)}` : 'wm_usr_current',
    userId: currentUserId,
    staffCode: currentUserId ? `CHR-${currentUserId.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'CHR-0001',
    name: currentUserName,
    email: currentUserEmail || 'current.user@chronos.io',
    role: 'Administrator',
    status: 'On-Site',
    avatarUrl: currentUserAvatar,
    workspaceId,
  }

  let list: StaffMember[] = [userEntry, ...rosterMembers.map((m) => ({
    id: m.id,
    staffCode: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    status: m.status,
    workspaceId,
  }))]

  if (role === 'hod') {
    list = list.filter((m) => m.role === 'Staff' || m.id === userEntry.id)
  }

  const filtered = list.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesTab =
      roleTab === 'All Roles' ||
      (roleTab === 'Administrators' && m.role === 'Administrator') ||
      (roleTab === 'Editors' && m.role === 'Editor') ||
      (roleTab === 'Staff' && m.role === 'Staff')
    return matchesSearch && matchesTab
  })

  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const validPage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (validPage - 1) * pageSize
  const paginatedMembers: StaffMember[] = filtered.slice(startIndex, startIndex + pageSize)

  return {
    members: paginatedMembers,
    totalItems,
    totalPages,
    currentPage: validPage,
    pageSize,
  }
}

export async function fetchStaffProfile(
  staffId: string,
  workspaceId?: string
): Promise<StaffProfile> {
  const currentAuth = await resolveCurrentAuthIdentity()
  const { userId: currentUserId, name: currentUserName, email: currentUserEmail, avatarUrl: currentUserAvatar } = currentAuth
  const cleanId = (staffId || '').trim()

  // Query biometric template status from database
  const isEnrolled = await checkBiometricEnrolled(cleanId)

  // Query live attendance history from attendance_logs
  const realActivities = await fetchStaffAttendanceHistory(cleanId)

  const isDirectCurrent =
    Boolean(currentUserId && cleanId.toLowerCase() === currentUserId.toLowerCase()) ||
    Boolean(currentUserId && cleanId.toLowerCase() === `chr-${currentUserId.replace(/-/g, '').slice(0, 4).toLowerCase()}`) ||
    cleanId === 'CHR-0001' ||
    cleanId === 'wm_usr_current' ||
    cleanId === 'me'

  if (isDirectCurrent && currentUserName) {
    const directUserEnrolled = isEnrolled || (currentUserId ? await checkBiometricEnrolled(currentUserId) : false)
    const directActivities = realActivities.length > 0 ? realActivities : (currentUserId ? await fetchStaffAttendanceHistory(currentUserId) : [])

    return {
      name: currentUserName,
      slug: slugify(currentUserName),
      staffId: currentUserId ? `CHR-${currentUserId.replace(/-/g, '').slice(0, 4).toUpperCase()}` : 'CHR-0001',
      role: 'Administrator',
      status: 'Active Duty',
      lastSync: 'Just now',
      uptimeReliability: '100%',
      accessLevel: '05',
      authProtocols: ['BIOMETRIC_OVERRIDE', 'MFA_ENABLED', 'PHYSICAL_KEY'],
      activities: directActivities.length > 0 ? directActivities : [
        { terminal: 'Main Gate - Arrival', action: 'Biometric Authenticated', time: '08:00 AM' },
        { terminal: 'Terminal 04 - East Wing', action: 'Workspace Synchronized', time: 'Just now' },
      ],
      timestamp: '2026.06.22.15.16',
      avatarUrl: currentUserAvatar,
      email: currentUserEmail,
      isBiometricEnrolled: directUserEnrolled,
    }
  }

  const supabase = getSupabase()
  try {
    let query = supabase
      .from('workspace_members')
      .select('id, user_id, role, created_at')
      .or(`id.eq.${cleanId},user_id.eq.${cleanId}`)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: member } = await query.maybeSingle()

    if (member) {
      const isCurrent = Boolean(currentUserId && member.user_id === currentUserId)
      let name = isCurrent ? currentUserName : ''
      let email = isCurrent ? currentUserEmail : ''
      let avatarUrl = isCurrent ? currentUserAvatar : undefined

      if (member.user_id && (!name || !email)) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('id', member.user_id)
            .maybeSingle()
          if (prof) {
            if (prof.full_name && !name) name = prof.full_name
            if (prof.email && !email) email = prof.email
            if (prof.avatar_url && !avatarUrl) avatarUrl = prof.avatar_url
          }
        } catch (err) {
          console.warn('Profile fetch error:', err)
        }
      }

      if (!name) name = currentUserName || 'Team Member'
      if (!email) email = currentUserEmail || 'staff@chronos.io'

      const staffCode = member.user_id
        ? `CHR-${member.user_id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
        : `CHR-${cleanId.replace(/-/g, '').slice(0, 4).toUpperCase()}`

      const memberBiometricEnrolled =
        isEnrolled || (member.user_id ? await checkBiometricEnrolled(member.user_id) : false)

      const memberActivities = realActivities.length > 0 
        ? realActivities 
        : (member.user_id ? await fetchStaffAttendanceHistory(member.user_id) : [])

      return {
        id: member.id,
        name,
        slug: slugify(name),
        staffId: staffCode,
        role: member.role === 'admin' ? 'Administrator' : member.role === 'editor' ? 'Editor' : 'Staff',
        status: 'Active Duty',
        lastSync: '1m ago',
        uptimeReliability: '99.8%',
        accessLevel: member.role === 'admin' ? '05' : '03',
        authProtocols: ['MFA_ENABLED', 'PHYSICAL_KEY', 'BIOMETRIC_OVERRIDE'],
        activities: memberActivities.length > 0 ? memberActivities : [
          { terminal: 'Main Gate - Arrival', action: 'Biometric Authenticated', time: '08:00 AM' },
          { terminal: 'Terminal 04 - East Wing', action: 'Workspace Synchronized', time: 'Just now' },
        ],
        timestamp: '2026.06.22.15.16',
        avatarUrl,
        email,
        isBiometricEnrolled: memberBiometricEnrolled,
      }
    }
  } catch (err) {
    console.warn('Error fetching member profile:', err)
  }

  const fallback = getProfile(cleanId, {
    id: currentUserId,
    name: currentUserName,
    email: currentUserEmail,
    avatarUrl: currentUserAvatar,
  })

  return {
    ...fallback,
    activities: realActivities.length > 0 ? realActivities : fallback.activities,
    isBiometricEnrolled: isEnrolled || fallback.isBiometricEnrolled,
  }
}
