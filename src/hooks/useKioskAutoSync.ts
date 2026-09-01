import { useState, useEffect, useCallback, useRef } from 'react'
import {
  checkBiometricSyncStatus,
  syncBiometricTemplates,
  type BiometricDifferential,
  type BiometricSyncResult,
} from '../services/biometricSyncService'

export type KioskSyncStatus = 'idle' | 'checking' | 'syncing' | 'synced' | 'offline' | 'error'

export interface KioskAutoSyncState {
  status: KioskSyncStatus
  bridgeOnline: boolean
  differential: BiometricDifferential | null
  progressMessage: string
  lastResult: BiometricSyncResult | null
  checkAndSync: (force?: boolean) => Promise<void>
}

export function useKioskAutoSync(workspaceId?: string): KioskAutoSyncState {
  const [status, setStatus] = useState<KioskSyncStatus>('checking')
  const [bridgeOnline, setBridgeOnline] = useState(true)
  const [differential, setDifferential] = useState<BiometricDifferential | null>(null)
  const [progressMessage, setProgressMessage] = useState('')
  const [lastResult, setLastResult] = useState<BiometricSyncResult | null>(null)
  const hasAutoCheckedRef = useRef(false)

  const checkAndSync = useCallback(
    async (force = false) => {
      setStatus('checking')
      setProgressMessage('Checking cloud database vs local gallery...')

      try {
        const check = await checkBiometricSyncStatus(workspaceId)
        setBridgeOnline(check.bridgeOnline)
        setDifferential(check.differential)

        if (!check.bridgeOnline) {
          setStatus('offline')
          setProgressMessage('Scanner bridge is offline')
          return
        }

        // If in sync and not forced, skip downloading!
        if (check.differential.inSync && !force) {
          setStatus('synced')
          setProgressMessage(`All ${check.differential.cloudTotal} templates up to date`)
          return
        }

        // Difference detected or force sync requested: start background sync
        setStatus('syncing')
        const result = await syncBiometricTemplates(
          workspaceId,
          (msg) => setProgressMessage(msg),
          force
        )
        setLastResult(result)
        setStatus(result.success ? 'synced' : 'error')
        setProgressMessage(result.message)
      } catch (err) {
        setStatus('error')
        setProgressMessage(err instanceof Error ? err.message : 'Sync check failed')
      }
    },
    [workspaceId]
  )

  // Auto-run on kiosk page load / entry
  useEffect(() => {
    if (!hasAutoCheckedRef.current) {
      hasAutoCheckedRef.current = true
      checkAndSync(false)
    }
  }, [checkAndSync])

  return {
    status,
    bridgeOnline,
    differential,
    progressMessage,
    lastResult,
    checkAndSync,
  }
}
