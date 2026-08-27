import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TerminalVaultService } from '../services/terminalVault'
import { TerminalApiService } from '../services/terminalApi'
import type { TerminalDevice, PairingResult } from '../types/terminal'

export function useTerminalAuth() {
  const queryClient = useQueryClient()
  const localToken = TerminalVaultService.getDeviceToken()

  // Query: Validate local device token and fetch current terminal identity
  const {
    data: terminal,
    isLoading,
    isError,
    refetch,
  } = useQuery<TerminalDevice | null>({
    queryKey: ['terminalDevice', localToken],
    queryFn: async () => {
      if (!localToken) return null
      const valid = await TerminalApiService.validateDeviceToken(localToken)
      if (!valid) {
        // Token was revoked or invalid - clear local device cache
        TerminalVaultService.clearDeviceEnrollment()
      }
      return valid
    },
    staleTime: 1000 * 15,
    refetchInterval: 30000, // 30-second live heartbeat
  })

  // Mutation: Pair this machine with an activation code
  const pairMutation = useMutation<
    PairingResult,
    Error,
    { code: string; workspaceId: string }
  >({
    mutationFn: async ({ code, workspaceId }) => {
      return TerminalApiService.pairDeviceWithCode(code, workspaceId)
    },
    onSuccess: (result) => {
      if (result.success && result.terminal) {
        queryClient.setQueryData(
          ['terminalDevice', result.deviceToken],
          result.terminal
        )
        queryClient.invalidateQueries({ queryKey: ['workspaceTerminals'] })
      }
    },
  })

  // Unpair this physical device locally
  const unpairDevice = () => {
    TerminalVaultService.clearDeviceEnrollment()
    queryClient.setQueryData(['terminalDevice', localToken], null)
    queryClient.invalidateQueries({ queryKey: ['terminalDevice'] })
  }

  return {
    terminal: terminal ?? null,
    isPaired: Boolean(terminal && terminal.status === 'online'),
    isLoading,
    isError,
    refetchTerminal: refetch,
    pairDevice: pairMutation.mutateAsync,
    isPairing: pairMutation.isPending,
    pairingError: pairMutation.error?.message,
    unpairDevice,
  }
}
