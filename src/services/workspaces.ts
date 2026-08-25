import { getSupabase } from '../lib/supabase'
import type { Workspace, WorkspaceRole } from '../types/workspaces'

/**
 * Fetch all workspaces that the currently signed-in user belongs to.
 * Uses a join on workspace_members and workspaces tables.
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
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        role,
        workspaces (
          id,
          name,
          slug,
          plan,
          avatar_url,
          accent_color,
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

    // Map the database response to frontend Workspace interface
    const workspaces: Workspace[] = data
      .filter((row) => row.workspaces !== null)
      .map((row) => {
        const ws = row.workspaces as unknown as {
          id: string
          name: string
          slug: string
          plan: 'enterprise' | 'pro' | 'starter' | 'free'
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
          role: (row.role as WorkspaceRole) || 'member',
          memberCount,
          kioskCount,
          avatarUrl: ws.avatar_url,
          accentColor: ws.accent_color,
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
 * Create a new workspace and add the creator as the 'owner' or 'admin'.
 */
export async function createWorkspace(
  name: string,
  slug: string,
  plan: 'enterprise' | 'pro' | 'starter' | 'free' = 'starter'
): Promise<{ data: Workspace | null; error: Error | null }> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('User is not authenticated') }
  }

  try {
    // 1. Insert Workspace
    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name,
        slug,
        plan,
        created_by: user.id,
      })
      .select()
      .single()

    if (wsError || !ws) {
      return { data: null, error: new Error(wsError?.message || 'Failed to create workspace') }
    }

    // 2. Add creator to workspace_members as owner/admin
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
