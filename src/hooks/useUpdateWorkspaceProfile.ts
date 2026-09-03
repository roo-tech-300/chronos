import { useMutation } from '@tanstack/react-query'
import {
  updateWorkspaceProfile,
  type WorkspaceProfileUpdates,
} from '../services/workspaceProfile'
import { useWorkspace } from '../context/useWorkspace'

/**
 * Editable profile payload plus the id of the workspace row being updated.
 */
export interface SaveWorkspaceProfileArgs extends WorkspaceProfileUpdates {
  workspaceId: string
}

/**
 * Server-state mutation for the Organization Profile card. Writes the identity
 * fields to public.workspaces and, on success, re-pulls the fresh row into the
 * live WorkspaceContext (selectWorkspace) so the navbar, kiosk headers and
 * category badges reflect the new identity immediately.
 */
export function useUpdateWorkspaceProfile() {
  const { selectWorkspace } = useWorkspace()

  const mutation = useMutation({
    mutationFn: ({ workspaceId, ...updates }: SaveWorkspaceProfileArgs) =>
      updateWorkspaceProfile(workspaceId, updates),
    onSuccess: (_result, variables) => {
      selectWorkspace(variables.workspaceId)
    },
  })

  return {
    saveProfile: mutation.mutate,
    isSaving: mutation.isPending,
    saveError: mutation.error instanceof Error ? mutation.error.message : null,
  }
}
