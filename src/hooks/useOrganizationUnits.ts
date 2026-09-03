import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchWorkspaceUnits,
  createOrganizationUnit,
  updateOrganizationUnit,
  deleteOrganizationUnit,
} from '../services/organizationUnitService'
import { assignMemberToUnit, fetchMemberUnitLineage } from '../services/organizationMemberService'
import type { CreateUnitInput, UpdateUnitInput } from '../types/organization'

const UNITS_QUERY_KEY = 'organization-units'
const LINEAGE_QUERY_KEY = 'member-unit-lineage'

/**
 * Server-state access for the workspace organization tree: a flat, path-ordered
 * unit list plus create/update/delete/assign mutations. Mutations unwrap the
 * service result and throw on failure so UI callers can try/catch mutateAsync.
 */
export function useWorkspaceUnits(workspaceId: string) {
  const queryClient = useQueryClient()
  const unitsKey = [UNITS_QUERY_KEY, workspaceId]

  const {
    data: units = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: unitsKey,
    queryFn: () => fetchWorkspaceUnits(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 2, // 2 min fresh cache protects the backend
  })

  const afterUnitChange = () => {
    void queryClient.invalidateQueries({ queryKey: unitsKey })
    // Unit renames/moves change every descendant lineage path.
    void queryClient.invalidateQueries({ queryKey: [LINEAGE_QUERY_KEY] })
  }

  const createUnitMutation = useMutation({
    mutationFn: async (input: CreateUnitInput) => {
      const { data, error } = await createOrganizationUnit(input)
      if (error) throw error
      return data
    },
    onSuccess: afterUnitChange,
  })

  const updateUnitMutation = useMutation({
    mutationFn: async ({ unitId, updates }: { unitId: string; updates: UpdateUnitInput }) => {
      const { data, error } = await updateOrganizationUnit(unitId, updates)
      if (error) throw error
      return data
    },
    onSuccess: afterUnitChange,
  })

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: string) => {
      const { data, error } = await deleteOrganizationUnit(unitId)
      if (error) throw error
      return data
    },
    onSuccess: afterUnitChange,
  })

  const assignMemberMutation = useMutation({
    mutationFn: async (input: { memberId: string; unitId: string; reportsTo?: string | null }) => {
      const { data, error } = await assignMemberToUnit(input.memberId, input.unitId, input.reportsTo)
      if (error) throw error
      return data
    },
    onSuccess: (_result, variables) => {
      // Assignments only touch workspace_members; refresh just that lineage.
      void queryClient.invalidateQueries({ queryKey: [LINEAGE_QUERY_KEY, variables.memberId] })
    },
  })

  return {
    /** Flat unit list sorted by ltree path (root-first, depth-first). */
    units,
    isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
    refetch,
    createUnit: createUnitMutation.mutateAsync,
    isCreating: createUnitMutation.isPending,
    updateUnit: updateUnitMutation.mutateAsync,
    isUpdating: updateUnitMutation.isPending,
    deleteUnit: deleteUnitMutation.mutateAsync,
    isDeleting: deleteUnitMutation.isPending,
    assignMember: assignMemberMutation.mutateAsync,
    isAssigning: assignMemberMutation.isPending,
  }
}

/**
 * A member's reporting chain (workspace root -> their own unit, inclusive),
 * used for breadcrumbs and "who can approve me" context.
 */
export function useMemberHierarchy(memberId?: string) {
  const cleanId = (memberId || '').trim()

  return useQuery({
    queryKey: [LINEAGE_QUERY_KEY, cleanId],
    queryFn: async () => {
      const { data, error } = await fetchMemberUnitLineage(cleanId)
      if (error) throw error
      return data
    },
    enabled: Boolean(cleanId),
    staleTime: 1000 * 60 * 2,
  })
}