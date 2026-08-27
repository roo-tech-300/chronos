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
} as const

export class TerminalVaultService {
  /**
   * Retrieves the locally saved permanent terminal token.
   */
  static getDeviceToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN)
    } catch {
      return null
    }
  }

  /**
   * Retrieves all cached local metadata for the paired terminal.
   */
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
   * Saves the permanent authentication token and metadata on this physical laptop.
   */
  static saveDeviceEnrollment(data: {
    token: string
    terminalId: string
    terminalName: string
    workspaceId: string
  }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, data.token)
      localStorage.setItem(STORAGE_KEYS.TERMINAL_ID, data.terminalId)
      localStorage.setItem(STORAGE_KEYS.TERMINAL_NAME, data.terminalName)
      localStorage.setItem(STORAGE_KEYS.WORKSPACE_ID, data.workspaceId)
    } catch (e) {
      console.error('[TerminalVault] Failed to persist device token to storage', e)
    }
  }

  /**
   * Clears device pairing (unpairs the laptop locally).
   */
  static clearDeviceEnrollment(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.TERMINAL_ID)
      localStorage.removeItem(STORAGE_KEYS.TERMINAL_NAME)
      localStorage.removeItem(STORAGE_KEYS.WORKSPACE_ID)
    } catch (e) {
      console.error('[TerminalVault] Failed to clear device token from storage', e)
    }
  }

  /**
   * Generates or retrieves a stable synthetic Hardware UUID for the client.
   */
  static getOrGenerateHardwareId(): string {
    try {
      let hwId = localStorage.getItem(STORAGE_KEYS.HARDWARE_UUID)
      if (!hwId) {
        const rand = Math.random().toString(36).substring(2, 10).toUpperCase()
        hwId = `HW-WEB-${rand}-${Date.now().toString(36).toUpperCase()}`
        localStorage.setItem(STORAGE_KEYS.HARDWARE_UUID, hwId)
      }
      return hwId
    } catch {
      return 'HW-ANON-DEVICE'
    }
  }
}
