import { getSupabase } from '../lib/supabase'
import { isUuid } from '../utils/uuid'
import type { Workspace, WorkspaceRole, WorkspaceDraft } from '../types/workspaces'

/**
 * Fetch all workspaces that the currently signed-in user belongs to.
 */
export async function getUserWorkspaces(userId?: string): Promise<{ data: Workspace[]; error: Error | null }> {
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
    console.log("Fetching this shi")
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
          created_at,
          workspace_members(count),
          kiosks(count)
        )
      `)
      .eq('user_id', targetUserId)

    if (error) {
      console.warn('Error fetching workspaces:', error.message)
      return { data: [], error: new Error(error.message) }
    }

    if (!data || data.length === 0) {
      return { data: [], error: null }
    }

    const workspaces: Workspace[] = data
      .filter((row) => row.workspaces !== null)
      .map((row) => {
        const ws = row.workspaces as unknown as {
          id: string
          name: string
          slug: string
          plan: 'enterprise' | 'pro' | 'starter' | 'free'
          category?: string
          avatar_url?: string
          accent_color?: string
          created_at?: string
          workspace_members?: [{ count: number }] | { count: number }[]
          kiosks?: [{ count: number }] | { count: number }[]
        }

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
          createdAt: ws.created_at,
        }
      })

    return { data: workspaces, error: null }
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Unknown error fetching workspaces'),
    }
  }
}

/**
 * Create a new workspace and bind creator as the admin/owner.
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

    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: draft.name.trim(),
        slug: uniqueSlug,
        plan: 'starter',
        category: draft.category || 'Technology',
        accent_color: draft.accentColor || '#4f46e5',
        avatar_url: draft.avatarUrl,
        created_by: user.id,
      })
      .select()
      .single()

    if (wsError || !ws) {
      return { data: null, error: new Error(wsError?.message || 'Failed to create workspace') }
    }

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: ws.id,
        user_id: user.id,
        role: 'admin',
      })

    if (memberError) {
      return { data: null, error: new Error(memberError.message) }
    }

    return {
      data: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        plan: ws.plan,
        category: ws.category,
        role: 'admin',
        memberCount: 1,
        kioskCount: 0,
        avatarUrl: ws.avatar_url,
        accentColor: ws.accent_color,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create workspace'),
    }
  }
}

/**
 * Fetch a single workspace by ID including aggregated member and kiosk counts.
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

    const typedWs = ws as unknown as {
      id: string
      name: string
      slug: string
      plan: 'enterprise' | 'pro' | 'starter' | 'free'
      category?: string
      avatar_url?: string
      accent_color?: string
      status?: 'active' | 'pending' | 'suspended'
      created_at?: string
      workspace_members?: [{ count: number }] | { count: number }[]
      kiosks?: [{ count: number }] | { count: number }[]
    }

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
        accentColor: typedWs.accent_color || '#7c007e',
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

export * from './workspaceStats'
