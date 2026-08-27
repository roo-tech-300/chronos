/**
 * Safe local storage & secure vault wrapper for Chronos Terminal tokens.
 * Gracefully handles standard web browser localStorage as well as Tauri native boundaries.
 */

const STORAGE_KEYS = {
  DEVICE_TOKEN: 'chronos_terminal_device_token',
  TERMINAL_ID: 'chronos_terminal_id',
  WORKSPACE_ID: 'chronos_terminal_workspace_id',
  TERMINAL_NAME: 'chronos_terminal_name',
  HARDWARE_UUID: 'chronos_hardware_uuid',
  WORKSPACE_ENROLLMENTS: 'chronos_workspace_enrollments',
} as const

export interface SavedEnrollment {
  token: string
  terminalId: string
  terminalName: string
  workspaceId?: string
  pairedAt: string
}

export class TerminalVaultService {
  static getDeviceToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN)
    } catch {
      return null
    }
  }

  static getLocalTerminalInfo(): {
    token: string | null
    terminalId: string | null
    terminalName: string | null
    workspaceId: string | null
  } {
    try {
      return {
        token: localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN),
        terminalId: localStorage.getItem(STORAGE_KEYS.TERMINAL_ID),
        terminalName: localStorage.getItem(STORAGE_KEYS.TERMINAL_NAME),
        workspaceId: localStorage.getItem(STORAGE_KEYS.WORKSPACE_ID),
      }
    } catch {
      return { token: null, terminalId: null, terminalName: null, workspaceId: null }
    }
  }

  /**
   * Retrieves active enrollment details for a specific workspace if previously enrolled.
   */
  static getWorkspaceEnrollment(workspaceId?: string): SavedEnrollment | null {
    if (!workspaceId) return null
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.WORKSPACE_ENROLLMENTS)
      if (!raw) return null
      const map: Record<string, SavedEnrollment> = JSON.parse(raw)
      return map[workspaceId] || null
    } catch {
      return null
    }
  }

  static saveDeviceEnrollment(data: {
    token: string
    terminalId: string
    terminalName: string
    workspaceId?: string
  }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, data.token)
      localStorage.setItem(STORAGE_KEYS.TERMINAL_ID, data.terminalId)
      localStorage.setItem(STORAGE_KEYS.TERMINAL_NAME, data.terminalName)
      if (data.workspaceId) {
        localStorage.setItem(STORAGE_KEYS.WORKSPACE_ID, data.workspaceId)

        // Also save into multi-workspace map
        const raw = localStorage.getItem(STORAGE_KEYS.WORKSPACE_ENROLLMENTS)
        const map: Record<string, SavedEnrollment> = raw ? JSON.parse(raw) : {}
        map[data.workspaceId] = {
          token: data.token,
          terminalId: data.terminalId,
          terminalName: data.terminalName,
          workspaceId: data.workspaceId,
          pairedAt: new Date().toISOString(),
        }
        localStorage.setItem(STORAGE_KEYS.WORKSPACE_ENROLLMENTS, JSON.stringify(map))
      } else {
        localStorage.removeItem(STORAGE_KEYS.WORKSPACE_ID)
      }
    } catch (e) {
      console.error('[TerminalVault] Failed to persist device token to storage', e)
    }
  }

  static clearDeviceEnrollment(workspaceId?: string): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.TERMINAL_ID)
      localStorage.removeItem(STORAGE_KEYS.TERMINAL_NAME)
      localStorage.removeItem(STORAGE_KEYS.WORKSPACE_ID)

      if (workspaceId) {
        const raw = localStorage.getItem(STORAGE_KEYS.WORKSPACE_ENROLLMENTS)
        if (raw) {
          const map: Record<string, SavedEnrollment> = JSON.parse(raw)
          delete map[workspaceId]
          localStorage.setItem(STORAGE_KEYS.WORKSPACE_ENROLLMENTS, JSON.stringify(map))
        }
      }
    } catch (e) {
      console.error('[TerminalVault] Failed to clear device token from storage', e)
    }
  }

  static getOrGenerateHardwareId(): string {
    try {
      let hwId = localStorage.getItem(STORAGE_KEYS.HARDWARE_UUID)
      if (!hwId) {
        const rand = Math.random().toString(36).substring(2, 10).toUpperCase()
        hwId = `HW-DEV-${rand}-${Date.now().toString(36).toUpperCase()}`
        localStorage.setItem(STORAGE_KEYS.HARDWARE_UUID, hwId)
      }
      return hwId
    } catch {
      return 'HW-ANON-DEVICE'
    }
  }
}
