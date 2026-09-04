import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchWorkspaceUnits,
  createOrganizationUnit,
  updateOrganizationUnit,
  deleteOrganizationUnit,
} from '../services/organizationUnitService'
import {
  assignMemberToUnit,
  removeMemberFromUnit,
  fetchMemberUnitLineage,
  fetchMemberUnitAssignments,
} from '../services/organizationMemberService'
import { fetchUnitMembers } from '../services/unitMembersService'
import type { AssignMemberInput, CreateUnitInput, UpdateUnitInput } from '../types/organization'

const UNITS_QUERY_KEY = 'organization-units'
const LINEAGE_QUERY_KEY = 'member-unit-lineage'
const ASSIGNMENTS_QUERY_KEY = 'member-unit-assignments'
const UNIT_MEMBERS_QUERY_KEY = 'unit-members'

/**
 * Server-state access for the workspace organization tree: a flat, path-ordered
 * unit list plus create/update/delete/assign mutations.
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
    queryFn: async () => {
      const { data, error } = await fetchWorkspaceUnits(workspaceId)
      if (error) throw error
      return data
    },
    enabled: Boolean(workspaceId),
    staleTime: 1000 * 60 * 2, // 2 min fresh cache
  })

  const afterUnitChange = () => {
    void queryClient.invalidateQueries({ queryKey: unitsKey })
    void queryClient.invalidateQueries({ queryKey: [LINEAGE_QUERY_KEY] })
    void queryClient.invalidateQueries({ queryKey: [UNIT_MEMBERS_QUERY_KEY] })
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
    mutationFn: async (input: AssignMemberInput) => {
      const { data, error } = await assignMemberToUnit(input)
      if (error) throw error
      return data
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: [LINEAGE_QUERY_KEY, variables.memberId] })
      void queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_QUERY_KEY, variables.memberId] })
      void queryClient.invalidateQueries({ queryKey: [UNIT_MEMBERS_QUERY_KEY, variables.unitId] })
    },
  })

  const removeAssignmentMutation = useMutation({
    mutationFn: async ({ memberId, unitId }: { memberId: string; unitId: string }) => {
      const { success, error } = await removeMemberFromUnit(memberId, unitId)
      if (error || !success) throw error || new Error('Failed to remove assignment')
      return success
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: [LINEAGE_QUERY_KEY, variables.memberId] })
      void queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_QUERY_KEY, variables.memberId] })
      void queryClient.invalidateQueries({ queryKey: [UNIT_MEMBERS_QUERY_KEY, variables.unitId] })
    },
  })

  return {
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
    removeAssignment: removeAssignmentMutation.mutateAsync,
    isRemoving: removeAssignmentMutation.isPending,
  }
}

/** Queries all department assignments for a specific member. */
export function useMemberAssignments(memberId?: string) {
  const cleanId = (memberId || '').trim()

  return useQuery({
    queryKey: [ASSIGNMENTS_QUERY_KEY, cleanId],
    queryFn: async () => {
      const { data, error } = await fetchMemberUnitAssignments(cleanId)
      if (error) throw error
      return data
    },
    enabled: Boolean(cleanId),
    staleTime: 1000 * 60 * 2,
  })
}

/** Queries all staff members assigned to an organization unit. */
export function useUnitMembers(unitId?: string) {
  const cleanId = (unitId || '').trim()

  return useQuery({
    queryKey: [UNIT_MEMBERS_QUERY_KEY, cleanId],
    queryFn: async () => {
      const { data, error } = await fetchUnitMembers(cleanId)
      if (error) throw error
      return data
    },
    enabled: Boolean(cleanId),
    staleTime: 1000 * 60 * 2,
  })
}

/** A member's reporting chain (workspace root -> their own unit, inclusive). */
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