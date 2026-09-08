import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type {
  Workspace,
  WorkspaceRole,
  WorkspaceDraft,
  WorkspaceJoinRequest,
  JoinRequestStatus,
} from '../types/workspaces'
import { assertWorkspaceWithCounts, assertJoinRequestRow } from '../utils/supabaseTypeGuards'

/**
 * Fetch all workspaces that the currently signed-in user belongs to.
 */
export async function getUserWorkspaces(
  userId?: string
): Promise<{ data: Workspace[]; error: Error | null }> {
  const supabase = getSupabase()

  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    targetUserId = user?.id
  }

  if (!targetUserId) {
    return { data: [], error: new Error('User is not authenticated') }
  }

  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        role,
        workspaces (
          id,
          name,
          slug,
          plan,
          category,
          avatar_url,
          accent_color,
          status,
          created_at,
          workspace_members(count),
          kiosks(count)
        )
      `)
      .eq('user_id', targetUserId)

    if (error) {
      return { data: [], error: new Error(error.message) }
    }

    if (!data || data.length === 0) {
      return { data: [], error: null }
    }

    const workspaces: Workspace[] = data
      .filter((row) => row.workspaces !== null)
      .map((row) => {
        const ws = assertWorkspaceWithCounts(row.workspaces)

        const memberCount = Array.isArray(ws.workspace_members) && ws.workspace_members[0]
          ? ws.workspace_members[0].count
          : 1

        const kioskCount = Array.isArray(ws.kiosks) && ws.kiosks[0]
          ? ws.kiosks[0].count
          : 0

        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          plan: ws.plan || 'starter',
          category: ws.category || 'Technology',
          role: (row.role as WorkspaceRole) || 'member',
          memberCount,
          kioskCount,
          avatarUrl: ws.avatar_url,
          accentColor: ws.accent_color || '#4f46e5',
          status: ws.status || 'active',
          createdAt: ws.created_at,
        }
      })

    return { data: workspaces, error: null }
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Error fetching workspaces'),
    }
  }
}

/**
 * Create a new workspace and insert the creator as its owner.
 */
export async function createWorkspace(
  draft: WorkspaceDraft
): Promise<{ data: Workspace | null; error: Error | null }> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('User is not authenticated') }
  }

  try {
    // Auto-generate slug from name + random unique suffix
    const baseSlug = draft.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'workspace'
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`

    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({
        name: draft.name,
        slug: uniqueSlug,
        plan: 'starter',
        category: draft.category || 'Technology',
        avatar_url: draft.avatarUrl,
        accent_color: draft.accentColor || '#4f46e5',
        created_by: user.id,
      })
      .select(`
        id,
        name,
        slug,
        plan,
        category,
        avatar_url,
        accent_color,
        status,
        join_code,
        created_at,
        workspace_members(count),
        kiosks(count)
      `)
      .single()

    if (error) {
      return { data: null, error: new Error(error.message || 'Failed to create workspace') }
    }

    // Insert creator as owner
    const { error: memberErr } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: ws.id,
        user_id: user.id,
        role: 'owner',
      })

    if (memberErr) {
      return { data: null, error: new Error(memberErr.message || 'Failed to set owner') }
    }

    const typedWs = assertWorkspaceWithCounts(ws)
    const memberCount = Array.isArray(typedWs.workspace_members) && typedWs.workspace_members[0]
      ? typedWs.workspace_members[0].count
      : 1

    const kioskCount = Array.isArray(typedWs.kiosks) && typedWs.kiosks[0]
      ? typedWs.kiosks[0].count
      : 0

    return {
      data: {
        id: typedWs.id,
        name: typedWs.name,
        slug: typedWs.slug,
        plan: typedWs.plan || 'starter',
        category: typedWs.category || 'Technology',
        role: 'owner',
        memberCount,
        kioskCount,
        avatarUrl: typedWs.avatar_url,
        accentColor: typedWs.accent_color || '#4f46e5',
        createdAt: typedWs.created_at,
        joinCode: typedWs.join_code,
        status: typedWs.status || 'active',
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error creating workspace'),
    }
  }
}

/**
 * Fetch a single workspace by ID (or slug) including aggregated member and kiosk counts.
 */
export async function getWorkspaceById(
  workspaceId: string
): Promise<{ data: Workspace | null; error: Error | null }> {
  const supabase = getSupabase()

  try {
    const isIdUuid = isUuid(workspaceId)
    let query = supabase
      .from('workspaces')
      .select(`
        id,
        name,
        slug,
        plan,
        category,
        avatar_url,
        accent_color,
        status,
        created_at,
        workspace_members(count),
        kiosks(count)
      `)

    if (isIdUuid) {
      query = query.eq('id', workspaceId)
    } else {
      query = query.eq('slug', workspaceId)
    }

    const { data: ws, error } = await query.maybeSingle()

    if (error || !ws) {
      return { data: null, error: new Error(error?.message || 'Workspace not found') }
    }

    const typedWs = assertWorkspaceWithCounts(ws)

    const memberCount =
      Array.isArray(typedWs.workspace_members) && typedWs.workspace_members[0]
        ? typedWs.workspace_members[0].count
        : 1

    const kioskCount =
      Array.isArray(typedWs.kiosks) && typedWs.kiosks[0] ? typedWs.kiosks[0].count : 0

    return {
      data: {
        id: typedWs.id,
        name: typedWs.name,
        slug: typedWs.slug,
        plan: typedWs.plan || 'starter',
        category: typedWs.category || 'Technology',
        role: 'admin',
        memberCount,
        kioskCount,
        avatarUrl: typedWs.avatar_url,
        accentColor: typedWs.accent_color || '#4f46e5',
        status: typedWs.status || 'active',
        createdAt: typedWs.created_at,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Error fetching workspace'),
    }
  }
}

/**
 * Submit a join request to a workspace using its random join code.
 * Resolves the workspace by join_code, then inserts a pending record.
 */
export async function joinWorkspaceByCode(
  joinCode: string,
  message?: string
): Promise<{ data: WorkspaceJoinRequest | null; error: Error | null }> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: new Error('Authentication required to join an organization.') }
  }

  const code = (joinCode || '').trim().toLowerCase()
  if (!code) {
    return { data: null, error: new Error('A join code is required.') }
  }

  try {
    // 1. Resolve workspace by join_code
    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('join_code', code)
      .maybeSingle()

    if (wsErr || !ws) {
      return { data: null, error: new Error('The join code you entered is invalid.') }
    }

    // 2. Insert join request
    const { data: req, error: reqErr } = await supabase
      .from('workspace_join_requests')
      .insert({
        workspace_id: ws.id,
        user_id: user.id,
        request_message: message?.trim() || null,
      })
      .select('*')
      .single()

    if (reqErr) {
      if (reqErr.code === '23505') {
        return { data: null, error: new Error('You already have a pending request for this organization.') }
      }
      return { data: null, error: new Error(reqErr.message || 'Failed to submit join request.') }
    }

    const safeReq = assertJoinRequestRow(req)

    return {
      data: {
        id: safeReq.id,
        workspaceId: safeReq.workspace_id,
        userId: safeReq.user_id,
        workspaceName: ws.name,
        requestMessage: safeReq.request_message,
        status: safeReq.status as JoinRequestStatus,
        requestedAt: safeReq.requested_at,
        reviewedAt: safeReq.reviewed_at,
        reviewerId: safeReq.reviewer_id,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error submitting join request'),
    }
  }
}

/**
 * Fetch join requests for a workspace (admin/owner visibility enforced via RLS).
 */
export async function getJoinRequests(
  workspaceId: string,
  status: JoinRequestStatus = 'pending'
): Promise<{ data: WorkspaceJoinRequest[]; error: Error | null }> {
  if (!workspaceId) return { data: [], error: null }

  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from('workspace_join_requests')
      .select(`
        id,
        workspace_id,
        user_id,
        request_message,
        status,
        requested_at,
        reviewed_at,
        reviewer_id,
        workspace:workspaces!inner(name),
        user:profiles!inner(full_name, email)
      `)
      .eq('workspace_id', workspaceId)
      .eq('status', status)
      .order('requested_at', { ascending: false })

    if (error) {
      return { data: [], error: new Error(error.message) }
    }
    if (!data) return { data: [], error: null }

    return {
      data: data.map((row) => {
        const safe = assertJoinRequestRow(row)
        return {
          id: safe.id,
          workspaceId: safe.workspace_id,
          userId: safe.user_id,
          workspaceName: safe.workspace?.name,
          userFullName: safe.user?.full_name,
          userEmail: safe.user?.email,
          requestMessage: safe.request_message,
          status: safe.status as JoinRequestStatus,
          requestedAt: safe.requested_at,
          reviewedAt: safe.reviewed_at,
          reviewerId: safe.reviewer_id,
        }
      }),
      error: null,
    }
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Failed to fetch join requests'),
    }
  }
}

/**
 * Approve or reject a pending join request.
 * On approval, the requesting user is added to workspace_members as a regular member.
 */
export async function processJoinRequest(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<{ data: boolean; error: Error | null }> {
  if (!requestId) return { data: false, error: new Error('Request ID is required.') }

  const supabase = getSupabase()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: false, error: new Error('Authentication required.') }

    // Fetch the request (including ids needed for the membership insert)
    const { data: existing, error: findErr } = await supabase
      .from('workspace_join_requests')
      .select('status, workspace_id, user_id')
      .eq('id', requestId)
      .maybeSingle()

    if (findErr) {
      return { data: false, error: new Error(findErr.message || 'Failed to find request.') }
    }
    if (!existing) {
      return { data: false, error: new Error('Join request not found.') }
    }
    if (existing.status !== 'pending') {
      return { data: false, error: new Error('This request has already been processed.') }
    }

    // Update the request (guarded: only still-pending rows can transition)
    const { error } = await supabase
      .from('workspace_join_requests')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewer_id: user.id,
      })
      .eq('id', requestId)
      .eq('status', 'pending')

    if (error) {
      return { data: false, error: new Error(error.message || 'Failed to update request.') }
    }

    // If approved, insert the requester into workspace_members
    if (status === 'approved' && existing.workspace_id && existing.user_id) {
      const { error: memberErr } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: existing.workspace_id,
          user_id: existing.user_id,
          role: 'member',
        })

      if (memberErr) {
        return { data: false, error: new Error('Request approved but failed to add member.') }
      }
    }

    return { data: true, error: null }
  } catch (err) {
    return {
      data: false,
      error: err instanceof Error ? err : new Error('Unknown error processing request'),
    }
  }
}

export * from './workspaceStats'
