import { getSupabase } from '../lib/supabase'
import { isRealWorkspaceUuid } from '../utils/uuid'

export interface WorkspaceProfileUpdates {
  name: string
  slug: string
  category: string
}

export interface WorkspaceProfileUpdateResult extends WorkspaceProfileUpdates {
  id: string
}

/**
 * Persist edits to the workspace identity row (name, slug/acronym, category)
 * on public.workspaces. Values are stored exactly as the user typed them
 * (only outer whitespace is trimmed). RLS restricts the UPDATE to workspace
 * owners & admins: a blocked update silently affects 0 rows, which Supabase
 * surfaces as a PGRST116 error on .single(). Duplicate slugs surface as
 * Postgres 23505.
 */
export async function updateWorkspaceProfile(
  workspaceId: string,
  updates: WorkspaceProfileUpdates
): Promise<{ data: WorkspaceProfileUpdateResult | null; error: Error | null }> {
  const supabase = getSupabase()

  if (!isRealWorkspaceUuid(workspaceId)) {
    return { data: null, error: new Error('Select a valid workspace before saving the profile.') }
  }

  const name = updates.name.trim()
  const slug = updates.slug.trim()
  const category = updates.category.trim() || 'Technology'

  if (!name) {
    return { data: null, error: new Error('Organization name is required.') }
  }
  if (!slug) {
    return { data: null, error: new Error('Short name / acronym is required.') }
  }

  try {
    const { data: ws, error } = await supabase
      .from('workspaces')
      .update({
        name,
        slug,
        category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspaceId)
      .select('id, name, slug, category')
      .single()

    if (error || !ws) {
      let message = error?.message || 'Failed to update the workspace profile.'
      if (error?.code === 'PGRST116') {
        message =
          'Update blocked: only workspace owners & admins can edit this profile, or the workspace no longer exists.'
      } else if (error?.code === '23505') {
        message = `The acronym "${slug}" is already used by another workspace. Choose a different one.`
      }
      return { data: null, error: new Error(message) }
    }

    const typedWs = ws as unknown as WorkspaceProfileUpdateResult

    return { data: typedWs, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error updating workspace profile'),
    }
  }
}
