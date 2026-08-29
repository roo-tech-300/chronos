import { useState, useCallback, useEffect } from 'react'
import {
  getAppEnvironment,
  isDevTauriOverrideActive,
  setDevTauriOverride,
  type AppEnvironment,
} from '../services/tauri'

export function useTauriEnvironment() {
  const [env, setEnv] = useState<AppEnvironment>(() => getAppEnvironment())
  const [devBypassActive, setDevBypassActive] = useState<boolean>(() => isDevTauriOverrideActive())

  const refreshEnv = useCallback(() => {
    setEnv(getAppEnvironment())
    setDevBypassActive(isDevTauriOverrideActive())
  }, [])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'chronos_dev_tauri_override') {
        refreshEnv()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [refreshEnv])

  const toggleDevBypass = useCallback(() => {
    const next = !devBypassActive
    setDevTauriOverride(next)
    setDevBypassActive(next)
    setEnv(getAppEnvironment())
  }, [devBypassActive])

  return {
    ...env,
    devBypassActive,
    toggleDevBypass,
    refreshEnv,
  }
}
