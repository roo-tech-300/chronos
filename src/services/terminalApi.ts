import { TerminalVaultService } from './terminalVault'
import { TerminalSupabaseService } from './terminalSupabase'
import { generateChronosPairingCode } from '../utils/pairingCode'
import type { TerminalDevice, PairingResult } from '../types/terminal'

const STORAGE_KEY_TERMINALS = 'chronos_workspace_terminals'

function getStoredTerminals(): TerminalDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TERMINALS)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as TerminalDevice[]
    // Exclude any legacy dummy mock IDs (e.g. term-001..004)
    return Array.isArray(parsed) ? parsed.filter((t) => !t.id.startsWith('term-00')) : []
  } catch {
    return []
  }
}

function saveStoredTerminals(terminals: TerminalDevice[]): void {
  try {
    // Keep only real non-mock terminals
    const clean = terminals.filter((t) => !t.id.startsWith('term-00'))
    localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(clean))
  } catch (e) {
    console.error('[TerminalApi] Failed to save terminals to storage', e)
  }
}

export class TerminalApiService {
  /**
   * Fetches all real terminals for a workspace from Supabase
   */
  static async fetchTerminals(workspaceId?: string): Promise<TerminalDevice[]> {
    const supabaseData = await TerminalSupabaseService.fetchKiosks(workspaceId)
    if (supabaseData !== null) {
      saveStoredTerminals(supabaseData)
      return supabaseData
    }

    const localList = getStoredTerminals()
    if (!workspaceId) return localList
    return localList.filter((t) => t.workspaceId === workspaceId || !t.workspaceId)
  }

  /**
   * Validates a device token against Supabase & local database.
   */
  static async validateDeviceToken(token: string): Promise<TerminalDevice | null> {
    const fromSupabase = await TerminalSupabaseService.findByDeviceToken(token)
    if (fromSupabase) {
      const list = getStoredTerminals()
      const updated = list.map((t) => (t.id === fromSupabase.id ? fromSupabase : t))
      saveStoredTerminals(updated)
      return fromSupabase
    }

    const list = getStoredTerminals()
    const found = list.find((t) => t.deviceToken === token)
    if (!found) return null

    const updated = list.map((t) =>
      t.id === found.id
        ? { ...t, status: 'online' as const, lastHeartbeatAt: new Date().toISOString() }
        : t
    )
    saveStoredTerminals(updated)
    return { ...found, status: 'online', lastHeartbeatAt: new Date().toISOString() }
  }

  /**
   * Attempts to pair this device using a pairing code in Supabase.
   */
  static async pairDeviceWithCode(code: string, workspaceId: string): Promise<PairingResult> {
    const rawClean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    const list = await this.fetchTerminals(workspaceId)

    const target = list.find((t) => {
      if (!t.pairingCode) return false
      const targetClean = t.pairingCode.toUpperCase().replace(/[^A-Z0-9]/g, '')
      const isMatch = targetClean === rawClean || t.pairingCode.toUpperCase() === code.trim().toUpperCase()
      return isMatch && (!workspaceId || t.workspaceId === workspaceId)
    })

    if (!target) {
      return {
        success: false,
        error: 'Invalid or expired activation code. Please check with an administrator.',
      }
    }

    if (target.pairingExpiresAt && new Date(target.pairingExpiresAt).getTime() < Date.now()) {
      return {
        success: false,
        error: 'This pairing code has expired. Please request a new code from the dashboard.',
      }
    }

    const newToken = `tkn_term_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`
    const hardwareId = TerminalVaultService.getOrGenerateHardwareId()

    // Sync to Supabase
    await TerminalSupabaseService.updatePairingSession(target.id, newToken, hardwareId)

    const updatedTerminal: TerminalDevice = {
      ...target,
      status: 'online',
      deviceToken: newToken,
      hardwareId,
      pairedAt: new Date().toISOString(),
      lastHeartbeatAt: new Date().toISOString(),
      pairingCode: undefined,
      pairingExpiresAt: undefined,
    }

    const updatedList = list.map((t) => (t.id === target.id ? updatedTerminal : t))
    saveStoredTerminals(updatedList)

    TerminalVaultService.saveDeviceEnrollment({
      token: newToken,
      terminalId: target.id,
      terminalName: target.name,
      workspaceId: target.workspaceId,
    })

    return {
      success: true,
      deviceToken: newToken,
      terminal: updatedTerminal,
    }
  }

  /**
   * Revokes a terminal's device token remotely.
   */
  static async revokeTerminalDevice(terminalId: string): Promise<void> {
    await TerminalSupabaseService.revokeKiosk(terminalId)
    const list = getStoredTerminals()
    const updatedList = list.map((t) =>
      t.id === terminalId
        ? {
            ...t,
            status: 'unpaired' as const,
            deviceToken: undefined,
            pairedAt: undefined,
            lastHeartbeatAt: undefined,
          }
        : t
    )
    saveStoredTerminals(updatedList)
  }

  /**
   * Generates a new 15-minute pairing code for an unpaired terminal.
   * Format: CH-{first & last letter of org}-{4 alphanumeric chars}
   */
  static async generatePairingCode(terminalId: string, orgName?: string): Promise<string> {
    const randomCode = generateChronosPairingCode(orgName)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString()

    await TerminalSupabaseService.updatePairingCode(terminalId, randomCode, expiresAt)

    const list = getStoredTerminals()
    const updatedList = list.map((t) =>
      t.id === terminalId
        ? {
            ...t,
            pairingCode: randomCode,
            pairingExpiresAt: expiresAt,
          }
        : t
    )
    saveStoredTerminals(updatedList)
    return randomCode
  }

  /**
   * Creates a new terminal entry in Supabase and local cache.
   */
  static async createTerminal(
    data: Omit<TerminalDevice, 'id' | 'status' | 'createdAt'>,
    orgName?: string
  ): Promise<TerminalDevice> {
    const list = getStoredTerminals()
    const randomCode = generateChronosPairingCode(orgName)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15).toISOString()
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `term-${Date.now().toString(36)}`

    const newTerminal: TerminalDevice = {
      ...data,
      id: newId,
      status: 'unpaired',
      pairingCode: randomCode,
      pairingExpiresAt: expiresAt,
      createdAt: new Date().toISOString(),
    }

    await TerminalSupabaseService.saveNewKiosk(newTerminal)

    saveStoredTerminals([newTerminal, ...list])
    return newTerminal
  }
}
