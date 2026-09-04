import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TerminalVaultService } from '../services/terminalVault'
import { TerminalApiService } from '../services/terminalApi'
import { TerminalHardwareService } from '../services/terminalHardware'
import { TerminalSupabaseService } from '../services/terminalSupabase'
import { useWorkspace } from '../context/useWorkspace'
import type { TerminalDevice, PairingResult } from '../types/terminal'

export function useTerminalAuth() {
  const queryClient = useQueryClient()
  const { currentWorkspace } = useWorkspace()
  const localToken = TerminalVaultService.getDeviceToken()
  const hardwareId = TerminalVaultService.getOrGenerateHardwareId()

  // Query: Validate local device token and fetch current terminal identity
  // Fallback: If device is in Supabase with this hardware_id in current workspace, resolve it
  const {
    data: terminal,
    isLoading,
    isError,
    refetch,
  } = useQuery<TerminalDevice | null>({
    queryKey: ['terminalDevice', currentWorkspace?.id, localToken, hardwareId],
    queryFn: async () => {
      // 1. Try checking by local device token first
      if (localToken) {
        const valid = await TerminalApiService.validateDeviceToken(localToken)
        if (valid) return valid
      }

      // 2. Hardware-level check in current workspace
      if (currentWorkspace?.id) {
        const hardwareMatch = await TerminalHardwareService.findActiveKioskByHardware(
          hardwareId,
          currentWorkspace.id
        )
        if (hardwareMatch && hardwareMatch.deviceToken) {
          // Sync local vault with active token
          TerminalVaultService.saveDeviceEnrollment({
            token: hardwareMatch.deviceToken,
            terminalId: hardwareMatch.id,
            terminalName: hardwareMatch.name,
            workspaceId: hardwareMatch.workspaceId,
          })
          // Keep liveness consistent — conditional heartbeat (only writes if stale)
          await TerminalSupabaseService.findByDeviceToken(hardwareMatch.deviceToken)
          return hardwareMatch
        }
      }

      return null
    },
    staleTime: 1000 * 15,
    refetchInterval: (_query) => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false
      return 30000
    },
  })

  // Mutation: Pair this machine with an activation code
  const pairMutation = useMutation<
    PairingResult,
    Error,
    { code: string; workspaceId?: string; workspaceName?: string }
  >({
    mutationFn: async ({ code, workspaceId, workspaceName }) => {
      return TerminalApiService.pairDeviceWithCode(code, workspaceId, workspaceName)
    },
    onSuccess: (result) => {
      if (result.success && result.terminal) {
        queryClient.setQueryData(
          ['terminalDevice', currentWorkspace?.id, result.deviceToken, hardwareId],
          result.terminal
        )
        queryClient.invalidateQueries({ queryKey: ['workspaceTerminals'] })
        queryClient.invalidateQueries({ queryKey: ['terminalDevice'] })
      }
    },
  })

  // Unpair this physical device locally
  const unpairDevice = () => {
    TerminalVaultService.clearDeviceEnrollment(currentWorkspace?.id)
    queryClient.setQueryData(['terminalDevice', currentWorkspace?.id, localToken, hardwareId], null)
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
