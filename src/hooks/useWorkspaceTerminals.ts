import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TerminalApiService } from '../services/terminalApi'
import type { TerminalDevice } from '../types/terminal'

export function useWorkspaceTerminals(workspaceId?: string, orgName?: string) {
  const queryClient = useQueryClient()

  // Query all terminals for the workspace with a live 10-second refresh
  const { data: terminals = [], isLoading, refetch } = useQuery<TerminalDevice[]>({
    queryKey: ['workspaceTerminals', workspaceId],
    queryFn: () => TerminalApiService.fetchTerminals(workspaceId),
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Mutation: Create a new terminal
  const createMutation = useMutation({
    mutationFn: (data: Omit<TerminalDevice, 'id' | 'status' | 'createdAt'>) =>
      TerminalApiService.createTerminal(data, orgName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceTerminals'] })
    },
  })

  // Mutation: Generate fresh pairing code
  const codeMutation = useMutation({
    mutationFn: (terminalId: string) =>
      TerminalApiService.generatePairingCode(terminalId, orgName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceTerminals'] })
    },
  })

  // Mutation: Revoke device access
  const revokeMutation = useMutation({
    mutationFn: (terminalId: string) =>
      TerminalApiService.revokeTerminalDevice(terminalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceTerminals'] })
    },
  })

  return {
    terminals,
    isLoading,
    refetch,
    createTerminal: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    generatePairingCode: codeMutation.mutateAsync,
    revokeTerminal: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
  }
}
